const express = require("express");
const router = express.Router();
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const { db } = require('./server');

const PAGE_SIZE = 20;

// ─── HELPERS ───────────────────────────────────────────────────────────────
const encodeCursor = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64");

const decodeCursor = (cursor) => {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

const buildNextCursor = (rows, sort) => {
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  return encodeCursor({ 
    id: last.property_id, 
    price: last.price 
  });
};

router.get("/properties/sell/non-admin", async (req, res) => {
  let sql = "";
  let params = [];

  try {
    const { cursor, limit = PAGE_SIZE, sort = "latest" } = req.query;
    const pageSize = Math.min(parseInt(limit) || PAGE_SIZE, 50);

    sql = `
      SELECT 
        p.property_id, p.mobile_no, p.type, p.admin_mobile, p.Admin_status,
        p.property_name, p.property_type, p.min_budget, p.max_budget,
        p.min_acres, p.max_acres, p.ratio, p.floor, p.comment, p.facing,
        p.roadwidth, p.site_area, p.length, p.width, p.units, p.buildup_area,
        p.posted_by, p.price, p.location, p.lat, p.long, p.nearby,
        p.no_of_flores, p._1bhk_count, p._2bhk_count, p._3bhk_count,
        p._4bhk_count, p.rooms_count, p.duplex_bedrooms, p.bedrooms_count,
        p.bathrooms_count, p.shop_count, p.house_count, p.balcony,
        p.power_backup, p.gated_security, p.borewell, p.parking, p.lift,
        p.advance_payment, p.boost_date, p.description, p.status,
        p.created_at, p.updated_at, p.category_id_id,
        p.user_id_id as owner,
        c.category_id, c.category as category_name, c.category_type
      FROM property_property as p
      LEFT JOIN property_property_cat as c ON p.category_id_id = c.category_id
      WHERE p.Admin_status = 'Approved' AND p.status = 1
    `;

    params = [];

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        if (sort === "price_asc") {
          sql += ` AND (p.price > ? OR (p.price = ? AND p.property_id < ?))`;
          params.push(decoded.price, decoded.price, decoded.id);
          sql += ` ORDER BY p.price ASC, p.property_id DESC`;
        } else if (sort === "price_desc") {
          sql += ` AND (p.price < ? OR (p.price = ? AND p.property_id < ?))`;
          params.push(decoded.price, decoded.price, decoded.id);
          sql += ` ORDER BY p.price DESC, p.property_id DESC`;
        } else {
          sql += ` AND p.property_id < ?`;
          params.push(decoded.id);
          sql += ` ORDER BY COALESCE(p.boost_date, p.created_at) DESC, p.property_id DESC`;
        }
      }
    } else {
      if (sort === "price_asc") {
        sql += ` ORDER BY p.price ASC, p.property_id DESC`;
      } else if (sort === "price_desc") {
        sql += ` ORDER BY p.price DESC, p.property_id DESC`;
      } else {
        sql += ` ORDER BY COALESCE(p.boost_date, p.created_at) DESC, p.property_id DESC`;
      }
    }

    sql += ` LIMIT ?`;
    params.push(pageSize + 1);

    const [rows] = await db.query(sql, params);

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? buildNextCursor(data, sort) : null;

    return res.json({
      success: true,
      data: { data },
      pagination: {
        nextCursor,
        hasMore,
        pageSize,
        returned: data.length,
      },
    });
  } catch (err) {
    console.error("[/properties/sell/non-admin] Error:", err.message);
    console.error("SQL:", sql);
    console.error("Params:", params);
    return res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/properties/sell/non-admin/search", async (req, res) => {
  let sql = "";
  let params = [];

  try {
    const { q, cursor, limit = PAGE_SIZE, sort = "latest" } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "Query param `q` is required" 
      });
    }

    const pageSize = Math.min(parseInt(limit) || PAGE_SIZE, 50);
    const searchTerm = `%${q.trim()}%`;

    sql = `
      SELECT 
        p.property_id, p.mobile_no, p.type, p.admin_mobile, p.Admin_status,
        p.property_name, p.property_type, p.min_budget, p.max_budget,
        p.min_acres, p.max_acres, p.ratio, p.floor, p.comment, p.facing,
        p.roadwidth, p.site_area, p.length, p.width, p.units, p.buildup_area,
        p.posted_by, p.price, p.location, p.lat, p.long, p.nearby,
        p.no_of_flores, p._1bhk_count, p._2bhk_count, p._3bhk_count,
        p._4bhk_count, p.rooms_count, p.duplex_bedrooms, p.bedrooms_count,
        p.bathrooms_count, p.shop_count, p.house_count, p.balcony,
        p.power_backup, p.gated_security, p.borewell, p.parking, p.lift,
        p.advance_payment, p.boost_date, p.description, p.status,
        p.created_at, p.updated_at, p.category_id_id,
        p.user_id_id as owner,
        c.category_id, c.category as category_name, c.category_type
      FROM property_property as p
      LEFT JOIN property_property_cat as c ON p.category_id_id = c.category_id
      WHERE p.Admin_status = 'Approved'
        AND p.status = 1
        AND (p.property_name LIKE ? OR p.location LIKE ? OR c.category LIKE ?)
    `;

    params = [searchTerm, searchTerm, searchTerm];

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        if (sort === "price_asc") {
          sql += ` AND (p.price > ? OR (p.price = ? AND p.property_id < ?))`;
          params.push(decoded.price, decoded.price, decoded.id);
          sql += ` ORDER BY p.price ASC, p.property_id DESC`;
        } else if (sort === "price_desc") {
          sql += ` AND (p.price < ? OR (p.price = ? AND p.property_id < ?))`;
          params.push(decoded.price, decoded.price, decoded.id);
          sql += ` ORDER BY p.price DESC, p.property_id DESC`;
        } else {
          sql += ` AND p.property_id < ?`;
          params.push(decoded.id);
          sql += ` ORDER BY COALESCE(p.boost_date, p.created_at) DESC, p.property_id DESC`;
        }
      }
    } else {
      if (sort === "price_asc") {
        sql += ` ORDER BY p.price ASC, p.property_id DESC`;
      } else if (sort === "price_desc") {
        sql += ` ORDER BY p.price DESC, p.property_id DESC`;
      } else {
        sql += ` ORDER BY COALESCE(p.boost_date, p.created_at) DESC, p.property_id DESC`;
      }
    }

    sql += ` LIMIT ?`;
    params.push(pageSize + 1);

    const [rows] = await db.query(sql, params);

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? buildNextCursor(data, sort) : null;

    return res.json({
      success: true,
      query: q,
      data: { data },
      pagination: { nextCursor, hasMore, pageSize, returned: data.length },
    });
  } catch (err) {
    console.error("[/properties/sell/non-admin/search] Error:", err.message);
    console.error("SQL:", sql);
    console.error("Params:", params);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/properties/sell/non-admin/filter", async (req, res) => {
  let sql = "";
  let params = [];

  try {
    const {
      q,
      category_id,
      category_name,
      min_price,
      max_price,
      cursor,
      limit = PAGE_SIZE,
      sort = "latest",
    } = req.query;

    const pageSize = Math.min(parseInt(limit) || PAGE_SIZE, 50);

    sql = `
      SELECT 
        p.property_id, p.mobile_no, p.type, p.admin_mobile, p.Admin_status,
        p.property_name, p.property_type, p.min_budget, p.max_budget,
        p.min_acres, p.max_acres, p.ratio, p.floor, p.comment, p.facing,
        p.roadwidth, p.site_area, p.length, p.width, p.units, p.buildup_area,
        p.posted_by, p.price, p.location, p.lat, p.long, p.nearby,
        p.no_of_flores, p._1bhk_count, p._2bhk_count, p._3bhk_count,
        p._4bhk_count, p.rooms_count, p.duplex_bedrooms, p.bedrooms_count,
        p.bathrooms_count, p.shop_count, p.house_count, p.balcony,
        p.power_backup, p.gated_security, p.borewell, p.parking, p.lift,
        p.advance_payment, p.boost_date, p.description, p.status,
        p.created_at, p.updated_at, p.category_id_id,
        p.user_id_id as owner,
        c.category_id, c.category as category_name, c.category_type
      FROM property_property as p
      LEFT JOIN property_property_cat as c ON p.category_id_id = c.category_id
      WHERE p.Admin_status = 'Approved' AND p.status = 1
    `;

    params = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      sql += ` AND (p.property_name LIKE ? OR p.location LIKE ? OR c.category LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      sql += ` AND p.category_id_id = ?`;
      params.push(parseInt(category_id));
    } else if (category_name) {
      sql += ` AND c.category = ?`;
      params.push(category_name);
    }

    if (min_price !== undefined && min_price !== "") {
      sql += ` AND p.price >= ?`;
      params.push(parseFloat(min_price));
    }
    if (max_price !== undefined && max_price !== "") {
      sql += ` AND p.price <= ?`;
      params.push(parseFloat(max_price));
    }

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        if (sort === "price_asc") {
          sql += ` AND (p.price > ? OR (p.price = ? AND p.property_id < ?))`;
          params.push(decoded.price, decoded.price, decoded.id);
          sql += ` ORDER BY p.price ASC, p.property_id DESC`;
        } else if (sort === "price_desc") {
          sql += ` AND (p.price < ? OR (p.price = ? AND p.property_id < ?))`;
          params.push(decoded.price, decoded.price, decoded.id);
          sql += ` ORDER BY p.price DESC, p.property_id DESC`;
        } else {
          sql += ` AND p.property_id < ?`;
          params.push(decoded.id);
          sql += ` ORDER BY COALESCE(p.boost_date, p.created_at) DESC, p.property_id DESC`;
        }
      }
    } else {
      if (sort === "price_asc") {
        sql += ` ORDER BY p.price ASC, p.property_id DESC`;
      } else if (sort === "price_desc") {
        sql += ` ORDER BY p.price DESC, p.property_id DESC`;
      } else {
        sql += ` ORDER BY COALESCE(p.boost_date, p.created_at) DESC, p.property_id DESC`;
      }
    }

    sql += ` LIMIT ?`;
    params.push(pageSize + 1);

    const [rows] = await db.query(sql, params);

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? buildNextCursor(data, sort) : null;

    return res.json({
      success: true,
      appliedFilters: { q, category_id, category_name, min_price, max_price, sort },
      data: { data },
      pagination: { nextCursor, hasMore, pageSize, returned: data.length },
    });
  } catch (err) {
    console.error("[/properties/sell/non-admin/filter] Error:", err.message);
    console.error("SQL:", sql);
    console.error("Params:", params);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/property-category", async (req, res) => {
  try {
    const cacheKey = "all_categories";
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [categories] = await db.execute(`
      SELECT category_id, category, category_type, created_at, updated_at, user_id_id
      FROM property_property_cat
      ORDER BY category ASC
    `);

    cache.set(cacheKey, categories);
    return res.json(categories);
  } catch (err) {
    console.error("[/property-category]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});



module.exports = router;