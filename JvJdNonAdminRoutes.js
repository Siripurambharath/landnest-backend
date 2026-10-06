const express = require('express');
const router  = express.Router();
const { db }  = require('./server.js');

const NodeCache = require('node-cache');
const cache     = new NodeCache({ stdTTL: 30 });
const typeCache = new NodeCache({ stdTTL: 300 });


// ═══════════════════════ JV/JD ═══════════════════════

function buildJvJdQuery({ cursor, search, propType, minPrice, maxPrice, limit }) {
  const conditions = [
    "p.Admin_status = 'Approved'",
    'p.status = 1',
    "p.type IN ('jv/jd', 'build to suit')"
  ];
  const params = [];

  if (cursor)            { conditions.push('p.property_id < ?');  params.push(cursor);          }
  if (propType?.trim())  { conditions.push('p.property_type = ?'); params.push(propType.trim()); }

  if (minPrice !== null) { conditions.push('COALESCE(p.price, p.min_budget) >= ?'); params.push(minPrice); }
  if (maxPrice !== null) { conditions.push('COALESCE(p.price, p.min_budget) <= ?'); params.push(maxPrice); }

  if (search?.trim()) {
    conditions.push(
      '(p.location LIKE ? OR p.nearby LIKE ? OR p.property_type LIKE ? OR p.type LIKE ?)'
    );
    const like = `%${search.trim()}%`;
    params.push(like, like, like, like);
  }

  params.push(limit + 1);

  const sql = `
    SELECT
      p.property_id as id,
      p.property_name as title,
      p.type as listingType,
      p.property_type as propertyType,
      p.price,
      COALESCE(p.price, p.min_budget) as effectivePrice,
      p.min_budget as minBudget,
      p.max_budget as maxBudget,
      p.min_acres as minAcres,
      p.max_acres as maxAcres,
      p.site_area as siteArea,
      p.length, p.width, p.units,
      p.roadwidth, p.ratio,
      p.facing,
      p.posted_by as postedBy,
      p.location as city,
      p.nearby as locality,
      p.mobile_no as mobileNo,
      p.lat,
      p.\`long\` as lng,
      p.user_id_id as userId,
      p.Admin_status as adminStatus,
      p.status,
      p.created_at as createdAt,
      p.updated_at as updatedAt
    FROM property_property p
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.property_id DESC
    LIMIT ?
  `;

  return { sql, params };
}

async function attachJvJdImages(items) {
  if (!items.length) return [];

  const ids = items.map(i => i.id);
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
    property_images: imageMap[item.id] ?? [],
  }));
}

async function handleJvJdList(req, res) {
  try {
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor   = req.query.cursor        ? parseInt(req.query.cursor)        : null;
    const search   = req.query.search        || '';
    const propType = req.query.property_type || '';
    const minPrice = req.query.min_price     ? parseFloat(req.query.min_price)   : null;
    const maxPrice = req.query.max_price     ? parseFloat(req.query.max_price)   : null;

    const cacheKey = !cursor
      ? `jvjd:${limit}:${search}:${propType}:${minPrice}:${maxPrice}`
      : null;

    if (cacheKey) {
      const hit = cache.get(cacheKey);
      if (hit) return res.json(hit);
    }

    const { sql, params } = buildJvJdQuery({ cursor, search, propType, minPrice, maxPrice, limit });
    const [rows] = await db.query(sql, params);

    const hasMore = rows.length > limit;
    const items   = hasMore ? rows.slice(0, limit) : rows;

    const response = {
      success: true,
      data: items,
      count: items.length,
      has_more: hasMore,
      next_cursor: hasMore ? items[items.length - 1].id : null,
      total_fetched: items.length,
    };

    if (response.data.length) {
      try {
        response.data = await attachJvJdImages(response.data);
      } catch (imgErr) {
        console.warn('JV/JD image attach skipped:', imgErr.message);
      }
    }

    if (cacheKey) cache.set(cacheKey, response);
    return res.json(response);

  } catch (err) {
    console.error('jvjd/non-admin error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
  }
}

async function handleJvJdPropertyTypes(req, res) {
  try {
    const hit = typeCache.get('jvjd:property-types');
    if (hit) return res.json(hit);

    const [rows] = await db.query(
      `SELECT DISTINCT property_type AS value, property_type AS label
       FROM property_property
       WHERE type IN ('jv/jd', 'build to suit')
         AND Admin_status = 'Approved'
         AND status = 1
         AND property_type IS NOT NULL
         AND property_type != ''
       ORDER BY property_type ASC`
    );

    typeCache.set('jvjd:property-types', rows);
    return res.json(rows);

  } catch (err) {
    console.error('jvjd/property-types error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
  }
}

async function handleJvJdFilterOptions(req, res) {
  try {
    const hit = typeCache.get('jvjd:filters');
    if (hit) return res.json(hit);

    const [typeOptions] = await db.query(`
      SELECT DISTINCT type AS value, type AS label
      FROM property_property
      WHERE Admin_status = 'Approved'
        AND status = 1
        AND type IN ('jv/jd', 'build to suit')
      ORDER BY type
    `);

    const [propertyTypeOptions] = await db.query(`
      SELECT DISTINCT property_type AS value, property_type AS label
      FROM property_property
      WHERE Admin_status = 'Approved'
        AND status = 1
        AND type IN ('jv/jd', 'build to suit')
        AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    const [countRows] = await db.query(`
      SELECT COUNT(*) as total
      FROM property_property
      WHERE Admin_status = 'Approved'
        AND status = 1
        AND type IN ('jv/jd', 'build to suit')
    `);

    const result = {
      success: true,
      typeOptions,
      propertyTypeOptions,
      priceRange: { min: 0, max: 10000000000 },
      totalProperties: countRows[0]?.total || 0,
    };

    typeCache.set('jvjd:filters', result);
    return res.json(result);

  } catch (err) {
    console.error('jvjd/filters error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
  }
}


// ═══════════════════════ AUCTION ═══════════════════════

function buildAuctionQuery({ cursor, search, propType, bankName, minPrice, maxPrice, limit }) {
  const conditions = [
    "p.admin_status = 'Approved'",
    'p.status = 1'
  ];
  const params = [];

  if (cursor)            { conditions.push('p.bankprop_id < ?');   params.push(cursor);          }
  if (propType?.trim())  { conditions.push('p.property_type = ?'); params.push(propType.trim()); }
  if (bankName?.trim())  { conditions.push('p.bank_name = ?');     params.push(bankName.trim()); }
  if (minPrice !== null) { conditions.push('p.reserve_price >= ?'); params.push(minPrice);       }
  if (maxPrice !== null) { conditions.push('p.reserve_price <= ?'); params.push(maxPrice);       }

  if (search?.trim()) {
    conditions.push(
      '(p.city_town LIKE ? OR p.area_town LIKE ? OR p.location LIKE ? OR p.property_type LIKE ? OR p.bank_name LIKE ?)'
    );
    const like = `%${search.trim()}%`;
    params.push(like, like, like, like, like);
  }

  params.push(limit + 1);

  const sql = `
    SELECT
      p.bankprop_id as id,
      p.lat,
      p.\`long\` as lng,
      p.property_type as propertyType,
      p.bank_name as bankName,
      p.bank_contact_details as bankContactDetails,
      p.action_type as actionType,
      p.reserve_price as price,
      p.reserve_price as effectivePrice,
      p.area, p.units,
      p.city_town as city,
      p.area_town as locality,
      p.location as fullLocation,
      p.possession_status as possessionStatus,
      p.emd_amount as emdAmount,
      p.auction_start_datetime as auctionStart,
      p.auction_end_datetime as auctionEnd,
      p.description,
      p.status,
      p.admin_status as adminStatus,
      p.created_at
    FROM property_bankauctionproperty p
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.bankprop_id DESC
    LIMIT ?
  `;

  return { sql, params };
}

async function handleAuctionList(req, res) {
  try {
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor   = req.query.cursor        ? parseInt(req.query.cursor)        : null;
    const search   = req.query.search        || '';
    const propType = req.query.property_type || req.query.type || '';
    const bankName = req.query.bank_name     || '';
    const minPrice = req.query.min_price     ? parseFloat(req.query.min_price)   : null;
    const maxPrice = req.query.max_price     ? parseFloat(req.query.max_price)   : null;

    const cacheKey = !cursor
      ? `auction:${limit}:${search}:${propType}:${bankName}:${minPrice}:${maxPrice}`
      : null;

    if (cacheKey) {
      const hit = cache.get(cacheKey);
      if (hit) return res.json(hit);
    }

    const { sql, params } = buildAuctionQuery({ cursor, search, propType, bankName, minPrice, maxPrice, limit });
    const [rows] = await db.query(sql, params);

    const hasMore = rows.length > limit;
    const items   = hasMore ? rows.slice(0, limit) : rows;

    const response = {
      success: true,
      count: items.length,
      properties: items,
      has_more: hasMore,
      next_cursor: hasMore ? items[items.length - 1].id : null,
      total_fetched: items.length,
    };

    if (cacheKey) cache.set(cacheKey, response);
    return res.json(response);

  } catch (err) {
    console.error('auction/non-admin error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
  }
}

async function handleAuctionFilterOptions(req, res) {
  try {
    const hit = typeCache.get('auction:filters');
    if (hit) return res.json(hit);

    const [typeOptions] = await db.query(`
      SELECT DISTINCT property_type AS value, property_type AS label
      FROM property_bankauctionproperty
      WHERE status = 1 AND admin_status = 'Approved'
        AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    const [bankOptions] = await db.query(`
      SELECT DISTINCT bank_name AS value, bank_name AS label
      FROM property_bankauctionproperty
      WHERE status = 1 AND admin_status = 'Approved'
        AND bank_name IS NOT NULL AND bank_name != ''
      ORDER BY bank_name
    `);

    const [countRows] = await db.query(`
      SELECT COUNT(*) as total
      FROM property_bankauctionproperty
      WHERE status = 1 AND admin_status = 'Approved'
    `);

    const result = {
      success: true,
      typeOptions,
      bankOptions,
      priceRange: { min: 0, max: 10000000000 },
      totalProperties: countRows[0]?.total || 0,
    };

    typeCache.set('auction:filters', result);
    return res.json(result);

  } catch (err) {
    console.error('auction/filters error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error', detail: err.message });
  }
}


// ═══════════════════════ ROUTES ═══════════════════════

router.get('/jvjd/non-admin/',         handleJvJdList);
router.get('/jvjd/property-types/',    handleJvJdPropertyTypes);
router.get('/jvjd/options/filters/',   handleJvJdFilterOptions);
router.get('/jvjd/by-type/:propertyType', (req, res) => {
  req.query.property_type = req.params.propertyType;
  return handleJvJdList(req, res);
});

router.get('/auction/non-admin/',            handleAuctionList);
router.get('/auction/options/filters/',      handleAuctionFilterOptions);
router.get('/auction/by-type/:propertyType', (req, res) => {
  req.query.property_type = req.params.propertyType;
  return handleAuctionList(req, res);
});
router.get('/auction/by-bank/:bankName', (req, res) => {
  req.query.bank_name = req.params.bankName;
  return handleAuctionList(req, res);
});

module.exports = router;