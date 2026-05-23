const express = require('express');
const router  = express.Router();
const { db }   = require('./server.js'); // Import the shared DB pool

const NodeCache = require('node-cache');
const cache     = new NodeCache({ stdTTL: 30 });   // 30-second cache
const typeCache = new NodeCache({ stdTTL: 300 });  // 5-minute cache for property types

// ─── Shared query builder (type is a parameter) ───────────────────────────────
function buildQuery({ type, cursor, search, propType, minPrice, maxPrice, limit }) {
  const conditions = [
    'p.type = ?',
    "p.Admin_status = 'Approved'",
    'p.status = 1'
  ];
  const params = [type]; // first placeholder is always the type

  if (cursor)            { conditions.push('p.property_id < ?');                              params.push(cursor);          }
  if (propType?.trim())  { conditions.push('p.property_type = ?');                            params.push(propType.trim()); }
  if (minPrice !== null) { conditions.push('p.price >= ?');                                   params.push(minPrice);        }
  if (maxPrice !== null) { conditions.push('p.price <= ?');                                   params.push(maxPrice);        }

  if (search?.trim()) {
    conditions.push('MATCH(p.location, p.property_name) AGAINST(? IN BOOLEAN MODE)');
    params.push(`${search.trim()}*`);
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

// ─── Generic handler (reused for both rent and lease) ────────────────────────
async function handleList(type, req, res) {
  try {
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor   = req.query.cursor        ? parseInt(req.query.cursor)        : null;
    const search   = req.query.search        || '';
    const propType = req.query.property_type || '';
    const minPrice = req.query.min_price     ? parseFloat(req.query.min_price)   : null;
    const maxPrice = req.query.max_price     ? parseFloat(req.query.max_price)   : null;

    const cacheKey = !cursor
      ? `${type}:${limit}:${search}:${propType}:${minPrice}:${maxPrice}`
      : null;

    if (cacheKey) {
      const hit = cache.get(cacheKey);
      if (hit) return res.json(hit);
    }

    const { sql, params } = buildQuery({ type, cursor, search, propType, minPrice, maxPrice, limit });
    const [rows] = await db.query(sql, params);

    const { hasMore, items, next_cursor } = paginatedResponse(rows, limit);
    if (!items.length) return res.json({ data: [], next_cursor: null, has_more: false, total_fetched: 0 });

    const data     = await attachImages(items);
    const response = { data, next_cursor, has_more: hasMore, total_fetched: data.length };

    if (cacheKey) cache.set(cacheKey, response);
    return res.json(response);

  } catch (err) {
    console.error(`${type}/non-admin error:`, err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

// ─── Generic by-type handler ─────────────────────────────────────────────────
async function handleByType(type, req, res) {
  try {
    const propType = req.params.propertyType?.trim();
    if (!propType) return res.status(400).json({ error: 'property_type is required' });

    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor   = req.query.cursor    ? parseInt(req.query.cursor)    : null;
    const search   = req.query.search   || '';
    const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : null;
    const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : null;

    const cacheKey = !cursor
      ? `${type}:type:${propType}:${limit}:${search}:${minPrice}:${maxPrice}`
      : null;

    if (cacheKey) {
      const hit = cache.get(cacheKey);
      if (hit) return res.json(hit);
    }

    const { sql, params } = buildQuery({ type, cursor, search, propType, minPrice, maxPrice, limit });
    const [rows] = await db.query(sql, params);

    const { hasMore, items, next_cursor } = paginatedResponse(rows, limit);
    if (!items.length) return res.json({ data: [], next_cursor: null, has_more: false, total_fetched: 0 });

    const data     = await attachImages(items);
    const response = { data, next_cursor, has_more: hasMore, total_fetched: data.length };

    if (cacheKey) cache.set(cacheKey, response);
    return res.json(response);

  } catch (err) {
    console.error(`${type}/by-type error:`, err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

// ─── Generic property-types handler ──────────────────────────────────────────
async function handlePropertyTypes(type, req, res) {
  try {
    const hit = typeCache.get(`property-types:${type}`);
    if (hit) return res.json(hit);

    const [rows] = await db.query(
      `SELECT DISTINCT property_type
       FROM property_property
       WHERE type = ? AND Admin_status = 'Approved'
         AND status = 1
         AND property_type IS NOT NULL AND property_type != ''
       ORDER BY property_type ASC`,
      [type]
    );

    const result = rows.map(r => r.property_type);
    typeCache.set(`property-types:${type}`, result);
    return res.json(result);

  } catch (err) {
    console.error(`${type}/property-types error:`, err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// RENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /rent/non-admin/?limit=&cursor=&search=&property_type=&min_price=&max_price=
router.get('/rent/non-admin/', (req, res) => handleList('rent', req, res));

// GET /rent/by-type/:propertyType?limit=&cursor=&search=&min_price=&max_price=
router.get('/rent/by-type/:propertyType', (req, res) => handleByType('rent', req, res));

// GET /rent/property-types/
router.get('/rent/property-types/', (req, res) => handlePropertyTypes('rent', req, res));


// ═══════════════════════════════════════════════════════════════════════════════
// LEASE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /lease/non-admin/?limit=&cursor=&search=&property_type=&min_price=&max_price=
router.get('/lease/non-admin/', (req, res) => handleList('lease', req, res));

// GET /lease/by-type/:propertyType?limit=&cursor=&search=&min_price=&max_price=
router.get('/lease/by-type/:propertyType', (req, res) => handleByType('lease', req, res));

// GET /lease/property-types/
router.get('/lease/property-types/', (req, res) => handlePropertyTypes('lease', req, res));


module.exports = router;