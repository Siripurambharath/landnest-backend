const express = require("express");
const { db } = require('./server');
const router = express.Router(); 




router.get('/map', async (req, res) => {
  const {
    south,
    north,
    west,
    east,
    type,
    propertyType,
    priceMin,
    priceMax
  } = req.query;

  try {
    let query = `
      SELECT
        p.property_id,
        p.property_name,
        p.price,
        p.lat,
        p.long,
        p.location,
        p.type,
        c.category AS category_name
      FROM property_property p
      LEFT JOIN property_property_cat c
        ON c.category_id = p.category_id_id
      WHERE p.Admin_status = 'Approved'
        AND p.lat IS NOT NULL
        AND p.long IS NOT NULL
        AND p.lat != ''
        AND p.long != ''
    `;

    const params = [];

    if (south && north && west && east) {
      query += `
        AND CAST(p.lat AS DECIMAL(10,6)) BETWEEN ? AND ?
        AND CAST(p.long AS DECIMAL(10,6)) BETWEEN ? AND ?
      `;

      params.push(
        parseFloat(south),
        parseFloat(north),
        parseFloat(west),
        parseFloat(east)
      );
    }

    if (propertyType) {
      const categories = propertyType.split(',');
      query += ` AND c.category IN (${categories.map(() => '?').join(',')})`;
      params.push(...categories);
    }

    if (type) {
      const types = type.split(',');
      query += ` AND p.type IN (${types.map(() => '?').join(',')})`;
      params.push(...types);
    }

    if (priceMin && priceMax) {
      query += ` AND p.price BETWEEN ? AND ?`;
      params.push(priceMin, priceMax);
    }

    query += ` ORDER BY p.created_at DESC`;

    const [properties] = await db.query(query, params);

    res.json({
      success: true,
      count: properties.length,
      properties
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


router.get('/property-cards', async (req, res) => {
  try {

    const [properties] = await db.query(`
      SELECT
        p.property_id,
        p.property_name,
        p.price,
        p.facing,
        p.site_area,
        p.buildup_area,
        p.units,
        p.posted_by,
        p.mobile_no,
        p.created_at,
        p.lat,
        p.long,
        c.category AS category_name
      FROM property_property p
      LEFT JOIN property_property_cat c
        ON c.category_id = p.category_id_id
      WHERE p.Admin_status='Approved'
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      count: properties.length,
      properties
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.get('/options/filters', async (req, res) => {
  try {
    const { type } = req.query;

    // Categories
    let categoryQuery = `
      SELECT DISTINCT
        c.category AS value,
        c.category AS label
      FROM property_property_cat c
      WHERE c.category IS NOT NULL
        AND c.category != ''
    `;

    const categoryParams = [];

    if (type && type.trim() !== '') {
      categoryQuery += ` AND c.category_type = ?`;
      categoryParams.push(type);
    }

    categoryQuery += ` ORDER BY c.category ASC`;

    const [categories] = await db.query(
      categoryQuery,
      categoryParams
    );

    // Price Range
    let priceQuery = `
      SELECT
        MIN(COALESCE(price, min_budget)) AS min_price,
        MAX(COALESCE(price, max_budget)) AS max_price
      FROM property_property
      WHERE Admin_status = 'Approved'
    `;

    const priceParams = [];

    if (type && type.trim() !== '') {
      priceQuery += ` AND type = ?`;
      priceParams.push(type);
    }

    const [priceRange] = await db.query(
      priceQuery,
      priceParams
    );

    // Total Properties
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM property_property
      WHERE Admin_status = 'Approved'
    `;

    const countParams = [];

    if (type && type.trim() !== '') {
      countQuery += ` AND type = ?`;
      countParams.push(type);
    }

    const [countResult] = await db.query(
      countQuery,
      countParams
    );

    res.json({
      success: true,
      categories,
      priceRange: {
        min: Number(priceRange[0]?.min_price || 0),
        max: Number(priceRange[0]?.max_price || 0)
      },
      totalProperties: countResult[0]?.total || 0
    });

  } catch (error) {
    console.error('Filter options error:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.get('/property/:id', async (req, res) => {
  const { id } = req.params;

  try {

    const [properties] = await db.query(`
      SELECT
        p.property_id,
        c.category AS category_name,
        p.mobile_no,
        p.type,
        p.admin_mobile,
        p.Admin_status,
        p.property_name,
        p.property_type,
        p.min_budget,
        p.max_budget,
        p.min_acres,
        p.max_acres,
        p.ratio,
        p.floor,
        p.comment,
        p.facing,
        p.roadwidth,
        p.site_area,
        p.length,
        p.width,
        p.units,
        p.buildup_area,
        p.posted_by,
        p.price,
        p.location,
        p.lat,
        p.long,
        p.nearby,
        p.no_of_flores,
        p._1bhk_count,
        p._2bhk_count,
        p._3bhk_count,
        p._4bhk_count,
        p.rooms_count,
        p.duplex_bedrooms,
        p.bedrooms_count,
        p.bathrooms_count,
        p.shop_count,
        p.house_count,
        p.balcony,
        p.power_backup,
        p.gated_security,
        p.borewell,
        p.parking,
        p.lift,
        p.advance_payment,
        p.boost_date,
        p.description,
        p.status,
        p.created_at,
        p.updated_at,
        p.user_id_id AS user_id,
        p.category_id_id AS category_id
      FROM property_property p
      LEFT JOIN property_property_cat c
        ON c.category_id = p.category_id_id
      WHERE p.property_id = ?
    `,[id]);

    if (!properties.length) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const property = properties[0];

    const [images] = await db.query(`
      SELECT
        id,
        image,
        uploaded_at,
        property_id
      FROM property_property_images
      WHERE property_id = ?
      ORDER BY id ASC
    `,[id]);

    property.property_images = images;

    res.json({
      success: true,
      property
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});




router.get('/:property_id/images', async (req, res) => {
  try {
    const { property_id } = req.params;

    const [images] = await db.query(
      `SELECT image
       FROM property_property_images
       WHERE property_id = ?
       ORDER BY id ASC`,
      [property_id]
    );

    res.json({
      success: true,
      property_id: Number(property_id),
      images: images.map(img => img.image)
    });

  } catch (error) {
    console.error('Error fetching property images:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});












module.exports = router;