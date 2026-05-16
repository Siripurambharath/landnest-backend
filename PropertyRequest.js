// routes/propertyRoutes.js
const express = require('express');
const router  = express.Router();
// const db    = require('./db.js');
const { db }   = require('./server.js'); // Import the shared DB pool

const GOOGLE_MAPS_API_KEY = 'AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU';

// ── Extract the most meaningful city keyword from a location string ────────────
// Examples:
//   "Hyderabad, Telangana, India"              → "Hyderabad"
//   "Secunderabad"                             → "Secunderabad"
//   "H.No. 29, Upadhyaj Ganj Hyderabad 331334"→ "Hyderabad"  ← won't send this, frontend sends clean name
//   "Khammam"                                  → "Khammam"
//
// The frontend already stores clean names (e.g. "Hyderabad" from the chip label),
// so this is a safety layer that strips trailing state/country parts from Google places.
function extractCityKeyword(locationStr) {
  if (!locationStr) return null;
  // Split by comma → first segment is the city/locality
  const firstPart = locationStr.split(',')[0].trim();
  // Strip 6-digit PIN codes
  const cleaned = firstPart.replace(/\b\d{6}\b/g, '').trim();
  return cleaned || null;
}

// ── GET /property-request/ ────────────────────────────────────────────────────
// Query params:
//   cursor          - last req_id seen (cursor pagination)
//   limit           - items per page (default 20, max 50)
//   looking_for     - category: Purchase | Rent | Lease | JV/JD | Build to Suit
//   property_types  - comma-separated list of property types (e.g. "Flat,Villa")
//   locations       - comma-separated city names — each matched with LIKE, OR logic

// ─── In-memory cache (use Redis in production) ───────────────────────────────
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 30 }); // 30-second cache

// ─── Shared query builder ─────────────────────────────────────────────────────
function buildSellQuery({ cursor, search, propType, minPrice, maxPrice, limit }) {
  const conditions = [
    "p.type = 'sell'",
    "p.Admin_status = 'Approved'",
    "p.status = 1"
  ];
  const params = [];

  if (cursor)              { conditions.push('p.property_id < ?');        params.push(cursor);              }
  if (propType?.trim())    { conditions.push('p.property_type = ?');      params.push(propType.trim());     } // ← no LOWER/TRIM; normalize on insert
  if (minPrice !== null)   { conditions.push('p.price >= ?');             params.push(minPrice);            }
  if (maxPrice !== null)   { conditions.push('p.price <= ?');             params.push(maxPrice);            }

  // Use FULLTEXT if available, else LIKE
  if (search?.trim()) {
    conditions.push(`MATCH(p.location, p.property_name) AGAINST(? IN BOOLEAN MODE)`);
    params.push(`${search.trim()}*`);
    // Fallback if no FULLTEXT:
    // conditions.push(`(p.location LIKE ? OR p.property_name LIKE ?)`);
    // params.push(`%${search}%`, `%${search}%`);
  }

  params.push(limit + 1);

  const sql = `
    SELECT
      p.property_id, p.property_name, p.property_type,
      p.facing, p.site_area, p.length, p.width, p.units,
      p.posted_by, p.price, p.location, p.lat, p.long,
      p.mobile_no, p.boost_date, p.created_at,
      p.category_id_id AS category_id,
      p.user_id_id     AS user_id,
      c.category       AS category_name
    FROM property_property p
    LEFT JOIN property_property_cat c ON p.category_id_id = c.category_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.property_id DESC
    LIMIT ?
  `;

  return { sql, params };
}

// ─── Attach images in ONE query, return merged data ──────────────────────────
async function attachImages(items) {
  if (!items.length) return [];
  const ids = items.map(i => i.property_id);

  const [imageRows] = await db.query(
    `SELECT property_id, image
     FROM property_property_images
     WHERE property_id IN (${ids.map(() => '?').join(',')})
     ORDER BY id ASC`,
    ids
  );

  // Build map O(n)
  const imageMap = imageRows.reduce((acc, img) => {
    (acc[img.property_id] ??= []).push({ image: img.image });
    return acc;
  }, {});

  return items.map(item => ({
    ...item,
    property_images: imageMap[item.property_id] ?? []
  }));
}

// ─── Standard paginated response ─────────────────────────────────────────────
function paginatedResponse(rows, limit) {
  const hasMore = rows.length > limit;
  const items   = hasMore ? rows.slice(0, limit) : rows;
  return {
    hasMore,
    items,
    next_cursor: hasMore ? items[items.length - 1].property_id : null
  };
}

// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit      = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor     = req.query.cursor      ? parseInt(req.query.cursor) : null;
    const lookingFor = req.query.looking_for || null;

    const propTypesRaw = req.query.property_types || req.query.property_type || null;
    const locationsRaw = req.query.locations      || req.query.location      || null;

    const propTypes = propTypesRaw
      ? propTypesRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    // Extract clean city keyword from each comma-separated location entry
    const locationKeywords = locationsRaw
      ? locationsRaw.split('|')           // ← use | as separator between locations
          .map(s => extractCityKeyword(s.trim()))
          .filter(Boolean)
      : [];

    const finalParams = [];
    const conditions  = [];

    // ── 1. Location JOIN (OR across all keywords) ─────────────────────────────
    let locationJoin = '';
    if (locationKeywords.length > 0) {
      const locConditions = locationKeywords
        .map(() => 'LOWER(location) LIKE LOWER(?)')
        .join(' OR ');
      locationJoin = `
        INNER JOIN (
          SELECT DISTINCT req_id_id
          FROM property_propertyrequestlocations
          WHERE ${locConditions}
        ) loc_filter ON pr.req_id = loc_filter.req_id_id
      `;
      locationKeywords.forEach(kw => finalParams.push(`%${kw}%`));
    }

    // ── 2. WHERE conditions ───────────────────────────────────────────────────
    if (cursor) {
      conditions.push('pr.req_id < ?');
      finalParams.push(cursor);
    }
    if (lookingFor) {
      conditions.push('LOWER(pr.looking_for) = LOWER(?)');
      finalParams.push(lookingFor);
    }
    if (propTypes.length === 1) {
      conditions.push('LOWER(pr.property_type) = LOWER(?)');
      finalParams.push(propTypes[0]);
    } else if (propTypes.length > 1) {
      const ph = propTypes.map(() => '?').join(', ');
      conditions.push(`LOWER(pr.property_type) IN (${ph})`);
      propTypes.forEach(t => finalParams.push(t));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    finalParams.push(limit + 1); // fetch one extra to detect hasMore

    const mainQuery = `
      SELECT
        pr.req_id,
        pr.looking_for,
        pr.property_type,
        pr.length,
        pr.width,
        pr.units,
        pr.area,
        pr.min_budget,
        pr.max_budget,
        pr.no_of_bedrooms,
        pr.min_monthly_rent,
        pr.max_monthly_rent,
        pr.min_year_lease,
        pr.max_year_lease,
        pr.min_acres,
        pr.max_acres,
        pr.min_budget_per_acre,
        pr.max_budget_per_acre,
        pr.min_expected_rental_income,
        pr.max_expected_rental_income,
        pr.ratio,
        pr.floor,
        pr.comment,
        pr.created_at,
        pr.updated_at,
        pr.user_id_id AS user_id
      FROM property_propertyrequest pr
      ${locationJoin}
      ${whereClause}
      ORDER BY pr.req_id DESC
      LIMIT ?
    `;

    const [rows] = await db.query(mainQuery, finalParams);

    const hasMore = rows.length > limit;
    const items   = hasMore ? rows.slice(0, limit) : rows;

    if (items.length === 0) {
      return res.json({ results: [], next_cursor: null, has_more: false });
    }

    // Batch-fetch pro_loc for all returned req_ids
    const reqIds = items.map(r => r.req_id);
    const ph     = reqIds.map(() => '?').join(',');

    const [locRows] = await db.query(
      `SELECT loc_id, req_id_id AS req_id, location, lat, \`long\`
       FROM property_propertyrequestlocations
       WHERE req_id_id IN (${ph})`,
      reqIds
    );

    const locMap = {};
    locRows.forEach(loc => {
      if (!locMap[loc.req_id]) locMap[loc.req_id] = [];
      locMap[loc.req_id].push({ location: loc.location, lat: loc.lat, long: loc.long });
    });

    const results = items.map(item => ({
      ...item,
      pro_loc: locMap[item.req_id] || [],
    }));

    return res.json({
      results,
      next_cursor  : hasMore ? items[items.length - 1].req_id : null,
      has_more     : hasMore,
      total_fetched: results.length,
    });

  } catch (err) {
    console.error('❌ property-request error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

router.get('/sell/non-admin/', async (req, res) => {
  try {
    const limit    = Math.min(parseInt(req.query.limit)     || 20,   50);
    const cursor   = req.query.cursor    ? parseInt(req.query.cursor)    : null;
    const search   = req.query.search   || '';
    const propType = req.query.property_type || '';
    const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
    const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

    // Cache key — skip cache if cursor present (paginating)
    const cacheKey = !cursor
      ? `sell:${limit}:${search}:${propType}:${minPrice}:${maxPrice}`
      : null;

    if (cacheKey) {
      const hit = cache.get(cacheKey);
      if (hit) return res.json(hit);
    }

    const { sql, params } = buildSellQuery({ cursor, search, propType, minPrice, maxPrice, limit });
    const [rows] = await db.query(sql, params);

    const { hasMore, items, next_cursor } = paginatedResponse(rows, limit);
    if (!items.length) return res.json({ data: [], next_cursor: null, has_more: false, total_fetched: 0 });

    const data = await attachImages(items);
    const response = { data, next_cursor, has_more: hasMore, total_fetched: data.length };

    if (cacheKey) cache.set(cacheKey, response);
    return res.json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

router.get('/sell/by-type/:propertyType', async (req, res) => {
  try {
    const propType = req.params.propertyType?.trim();
    if (!propType) return res.status(400).json({ error: 'property_type is required' });

    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor   = req.query.cursor    ? parseInt(req.query.cursor)    : null;
    const search   = req.query.search   || '';
    const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
    const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

    const cacheKey = !cursor
      ? `sell:type:${propType}:${limit}:${search}:${minPrice}:${maxPrice}`
      : null;

    if (cacheKey) {
      const hit = cache.get(cacheKey);
      if (hit) return res.json(hit);
    }

    const { sql, params } = buildSellQuery({ cursor, search, propType, minPrice, maxPrice, limit });
    const [rows] = await db.query(sql, params);

    const { hasMore, items, next_cursor } = paginatedResponse(rows, limit);
    if (!items.length) return res.json({ data: [], next_cursor: null, has_more: false, total_fetched: 0 });

    const data = await attachImages(items);
    const response = { data, next_cursor, has_more: hasMore, total_fetched: data.length };

    if (cacheKey) cache.set(cacheKey, response);
    return res.json(response);

  } catch (err) {
    console.error('sell/by-type error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// Property types — cache aggressively (changes rarely)
const typeCache = new NodeCache({ stdTTL: 300 }); // 5 min

router.get('/sell/property-types/', async (req, res) => {
  try {
    const hit = typeCache.get('property-types');
    if (hit) return res.json(hit);

    const [rows] = await db.query(`
      SELECT DISTINCT property_type
      FROM property_property
      WHERE type = 'sell' AND Admin_status = 'Approved'
        AND status = 1
        AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type ASC
    `);

    const result = rows.map(r => r.property_type);
    typeCache.set('property-types', result);
    return res.json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});
 
// ── Proxy: Places Autocomplete ────────────────────────────────────────────────
router.get('/maps/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.json({ predictions: [], status: 'INVALID_REQUEST' });
    const url      = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
    const response = await fetch(url);
    const data     = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Autocomplete proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Proxy: Place Details ──────────────────────────────────────────────────────
router.get('/maps/place-details', async (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id) return res.status(400).json({ error: 'place_id required' });
    const url      = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data     = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Place details proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Proxy: Reverse Geocode ────────────────────────────────────────────────────
router.get('/maps/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
    const url      = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data     = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Reverse geocode proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;