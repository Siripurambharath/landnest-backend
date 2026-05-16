const express = require("express");
const { db } = require('./server');

const router = express.Router();   
module.exports = router;


router.get('/:id/images', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID'
      });
    }

    const [images] = await db.execute(
      `SELECT id, image 
       FROM property_property_images 
       WHERE property_id = ? 
       ORDER BY id`,
      [propertyId]
    );

    res.json({
      success: true,
      images: images.map(i => i.image)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images'
    });
  }
});
router.post('/images/batch', async (req, res) => {
  try {
    const { propertyIds } = req.body;
    
    if (!propertyIds || !propertyIds.length) {
      return res.json({ success: true, images: {} });
    }
    
    const placeholders = propertyIds.map(() => '?').join(',');
    const [images] = await db.query(
      `SELECT property_id, image FROM property_property_images 
       WHERE property_id IN (${placeholders})
       ORDER BY property_id, id`,
      propertyIds
    );
    
    // Group images by property_id
    const imagesByProperty = {};
    images.forEach(img => {
      if (!imagesByProperty[img.property_id]) {
        imagesByProperty[img.property_id] = [];
      }
      imagesByProperty[img.property_id].push(img.image);
    });
    
    res.json({
      success: true,
      images: imagesByProperty
    });
  } catch (error) {
    console.error('Error fetching batch images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images'
    });
  }
});


router.get('/map', async (req, res) => {
  const {
    south, north, west, east,
    type,
    propertyType,
    zoom,
    priceMin,
    priceMax,
    limit = 10000
  } = req.query;

  try {
    let query = `
      SELECT 
        property_id as id,
        property_name as title,
        property_type,
        type as listingType,
        COALESCE(price, min_budget) as price,
        min_budget,
        max_budget,
        lat,
        \`long\` as lng,
        location,
        nearby as locality,
        buildup_area,
        site_area,
        bedrooms_count as bedrooms,
        bathrooms_count as bathrooms,
        floor,
        facing,
        description,
        status,
        Admin_status,
        created_at
      FROM property_property
      WHERE status = 1
        AND Admin_status = 'Approved'
        AND lat IS NOT NULL
        AND \`long\` IS NOT NULL
        AND TRIM(lat) != ''
        AND TRIM(\`long\`) != ''
    `;

    const params = [];

    // ---------------------------
    // SAFE BOUND FILTER
    // ---------------------------
    const s = parseFloat(south);
    const n = parseFloat(north);
    const w = parseFloat(west);
    const e = parseFloat(east);

    if (![s, n, w, e].some(v => isNaN(v))) {
      query += `
        AND CAST(lat AS DECIMAL(10,6)) BETWEEN ? AND ?
        AND CAST(\`long\` AS DECIMAL(10,6)) BETWEEN ? AND ?
      `;
      params.push(s, n, w, e);
    }

    // ---------------------------
    // SAFE PRICE FILTER
    // ---------------------------
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);

    if (!isNaN(min) && !isNaN(max)) {
      query += ` AND COALESCE(price, min_budget) BETWEEN ? AND ?`;
      params.push(min, max);
    }

    // ---------------------------
    // PROPERTY TYPE FILTER (SAFE)
    // ---------------------------
    if (propertyType && propertyType.trim() !== "") {
      const arr = propertyType.split(',').filter(Boolean);

      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND property_type IN (${placeholders})`;
        params.push(...arr);
      }
    }

    // ---------------------------
    // TYPE FILTER (SAFE)
    // ---------------------------
   if (type && type.trim() !== "") {
  const arr = type.split(',').filter(Boolean);

  if (arr.length > 0) {
    const placeholders = arr.map(() => '?').join(',');

    query += ` AND type IN (${placeholders})`;

    params.push(...arr); // ✅ THIS IS THE FIX
  }
}

    // ---------------------------
    // LIMIT SAFE
    // ---------------------------
    const zoomLevel = parseInt(zoom) || 5;
    let finalLimit = parseInt(limit) || 1000;

    if (zoomLevel <= 7) finalLimit = Math.min(finalLimit, 2000);
    else if (zoomLevel <= 9) finalLimit = Math.min(finalLimit, 5000);
    else if (zoomLevel <= 12) finalLimit = Math.min(finalLimit, 10000);

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(finalLimit);

    // ---------------------------
    // EXECUTE QUERY
    // ---------------------------
    const [properties] = await db.execute(query, params);

    res.json({
      success: true,
      count: properties.length,
      properties
    });

  } catch (error) {
    console.error('Map API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      properties: []
    });
  }
});
// Get property details by ID - FIXED
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [properties] = await db.query(`
      SELECT 
        property_id as id,
        property_name as title,
        property_type,
        type as listingType,
        COALESCE(price, min_budget, 0) as price,
        min_budget,
        max_budget,
        lat,
        \`long\` as lng,
        location,
        nearby as locality,
        buildup_area,
        site_area,
        bedrooms_count as bedrooms,
        bathrooms_count as bathrooms,
        floor,
        facing,
        description,
        status,
        Admin_status,
        user_id_id,
        posted_by,
        created_at,
        updated_at,
        mobile_no,
        admin_mobile,
        min_acres,
        max_acres,
        ratio,
        comment,
        roadwidth,
        length,
        width,
        units,
        no_of_flores,
        _1bhk_count,
        _2bhk_count,
        _3bhk_count,
        _4bhk_count,
        rooms_count,
        duplex_bedrooms,
        shop_count,
        house_count,
        balcony,
        power_backup,
        gated_security,
        borewell,
        parking,
        lift,
        advance_payment,
        boost_date,
        category_id_id
      FROM property_property 
      WHERE property_id = ? AND status = 1
    `, [id]);

    if (properties.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Property not found' 
      });
    }

    const property = properties[0];
    
    // Get images
    const [images] = await db.query(
      'SELECT image FROM property_property_images WHERE property_id = ? ORDER BY id',
      [id]
    );
    
    property.images = images.map(img => img.image);

    res.json({
      success: true,
      property: property
    });

  } catch (error) {
    console.error('Property detail error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get filter options - FIXED
router.get('/options/filters', async (req, res) => {
  try {
    const { type } = req.query;
    
    console.log('Filter options requested for type:', type);
    
    let typeCondition = "";
    let queryParams = [];
    
    // If type is provided and not empty, add to WHERE clause
    if (type && type.trim() !== '') {
      typeCondition = " AND type = ?";
      queryParams.push(type);
    }

    // Get unique property types based on type filter
    const [categories] = await db.query(`
      SELECT DISTINCT property_type as value, property_type as label
      FROM property_property 
      WHERE property_type IS NOT NULL 
        AND property_type != '' 
        AND status = 1
        AND Admin_status = 'Approved'
        ${typeCondition}
      ORDER BY property_type
    `, queryParams);

    // Get price range based on type filter
    const [priceRange] = await db.query(`
      SELECT 
        MIN(COALESCE(price, min_budget, 0)) as min_price,
        MAX(COALESCE(price, max_budget, 0)) as max_price
      FROM property_property 
      WHERE status = 1 
        AND Admin_status = 'Approved'
        ${typeCondition}
    `, queryParams);

    // Get total count based on type filter
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM property_property 
      WHERE status = 1 
        AND Admin_status = 'Approved'
        ${typeCondition}
    `, queryParams);

    console.log('Categories found:', categories.length);
    console.log('Price range:', priceRange[0]);
    console.log('Total count:', countResult[0]?.total);

    res.json({
      success: true,
      categories: categories.length ? categories : [],
      priceRange: {
        min: parseFloat(priceRange[0]?.min_price) || 0,
        max: parseFloat(priceRange[0]?.max_price) || 5000000000
      },
      totalProperties: parseInt(countResult[0]?.total) || 0
    });

  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});




//jv/jd api
// Get filter options for the new flow
router.get('/options/filters/new', async (req, res) => {
  try {
    // Get unique type values (jvjd, built to suit) - This is MAIN category
    const [typeOptions] = await db.execute(`
      SELECT DISTINCT type as value, type as label 
      FROM property_property 
      WHERE status = 1 AND Admin_status = 'Approved'
      AND type IS NOT NULL AND type != ''
      ORDER BY type
    `);

    // Get unique property_type values (plot, land) - This is SUB category
    const [propertyTypeOptions] = await db.execute(`
      SELECT DISTINCT property_type as value, property_type as label 
      FROM property_property 
      WHERE status = 1 AND Admin_status = 'Approved'
      AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    // Get price range
    const [priceRange] = await db.execute(`
      SELECT 
        MIN(COALESCE(price, min_budget)) as min,
        MAX(COALESCE(price, min_budget)) as max
      FROM property_property 
      WHERE status = 1 AND Admin_status = 'Approved'
    `);

    // Get total count
    const [totalCount] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM property_property 
      WHERE status = 1 AND Admin_status = 'Approved'
    `);

    console.log('typeOptions (from type column):', typeOptions);
    console.log('propertyTypeOptions (from property_type column):', propertyTypeOptions);

    res.json({
      success: true,
      typeOptions: typeOptions,           // jvjd, built to suit
      propertyTypeOptions: propertyTypeOptions, // plot, land
      priceRange: {
        min: priceRange[0]?.min || 0,
        max: priceRange[0]?.max || 5000000000
      },
      totalProperties: totalCount[0]?.total || 0
    });

  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get map properties for new flow
router.get('/map/new', async (req, res) => {
  const {
    south, north, west, east,
    type,                // jvjd or built to suit (from type column)
    propertyType,        // plot or land (from property_type column)
    zoom,
    priceMin, priceMax,
    limit = 10000
  } = req.query;

  try {
    let query = `
      SELECT 
        property_id as id,
        lat,
        \`long\` as lng,
        property_type as propertyType,
        type as listingType,
        COALESCE(price, min_budget) as price,
        buildup_area as area,
        location as city,
        property_name as title,
        nearby as locality,
        created_at,
        CASE 
          WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 'new_launch'
          ELSE 'ready'
        END as status
      FROM property_property 
      WHERE status = 1 
        AND Admin_status = 'Approved'
        AND lat IS NOT NULL 
        AND \`long\` IS NOT NULL
        AND lat != ''
        AND \`long\` != ''
        AND TRIM(lat) != ''
        AND TRIM(\`long\`) != ''
    `;

    const params = [];

    // Bounds filter
    if (south && north && west && east) {
      query += ` 
        AND CAST(lat AS DECIMAL(10,6)) BETWEEN ? AND ? 
        AND CAST(\`long\` AS DECIMAL(10,6)) BETWEEN ? AND ?
      `;
      params.push(
        parseFloat(south), parseFloat(north),
        parseFloat(west), parseFloat(east)
      );
    }

    // Price filter
    if (priceMin !== undefined && priceMax !== undefined) {
      query += ` AND COALESCE(price, min_budget) BETWEEN ? AND ?`;
      params.push(parseFloat(priceMin), parseFloat(priceMax));
    }

    // ✅ Main Category filter (jvjd or built to suit) - filters type column
    if (type) {
      const arr = type.split(',');
      const placeholders = arr.map(() => '?').join(',');
      query += ` AND type IN (${placeholders})`;
      params.push(...arr);
    }

    // ✅ Sub Category filter (plot or land) - filters property_type column
    if (propertyType) {
      const arr = propertyType.split(',');
      const placeholders = arr.map(() => '?').join(',');
      query += ` AND property_type IN (${placeholders})`;
      params.push(...arr);
    }

    // Zoom-based limit
    const zoomLevel = parseInt(zoom) || 5;
    let finalLimit = Math.min(parseInt(limit), 20000);

    if (zoomLevel <= 7) {
      finalLimit = Math.min(finalLimit, 2000);
    } else if (zoomLevel <= 9) {
      finalLimit = Math.min(finalLimit, 5000);
    } else if (zoomLevel <= 12) {
      finalLimit = Math.min(finalLimit, 10000);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(finalLimit);

    const [properties] = await db.execute(query, params);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      propertyType: p.propertyType || 'plot',
      listingType: p.listingType || 'jvjd',
      price: p.price || 0,
      area: p.area || 1000,
      city: p.city || 'India',
      locality: p.locality || p.city || 'Location',
      title: p.title || `${p.propertyType} in ${p.locality}`,
      status: p.status,
      created_at: p.created_at
    }));

    res.json({
      success: true,
      count: transformed.length,
      properties: transformed,
      zoom: zoomLevel,
      filters: {
        type: type || null,
        propertyType: propertyType || null
      }
    });

  } catch (error) {
    console.error('Map data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      properties: []
    });
  }
});






router.get('/auctionpropertymap', async (req, res) => {
  const {
    south, north, west, east,
    type,              
    bank_name,
    priceMin, priceMax,
    zoom,
    limit = 10000
  } = req.query;

  try {
    let query = `
      SELECT 
        bankprop_id as id,
        lat,
        \`long\` as lng,
        property_type as propertyType,
        bank_name as bankName,
        action_type as actionType,
        reserve_price as price,
        area,
        units,
        city_town as city,
        area_town as locality,
        location as fullLocation,
        possession_status as possessionStatus,
        emd_amount as emdAmount,
        auction_start_datetime as auctionStart,
        auction_end_datetime as auctionEnd,
        description,
        status,
        created_at,
        CASE 
          WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 'new'
          ELSE 'old'
        END as listingStatus
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
        AND lat IS NOT NULL 
        AND \`long\` IS NOT NULL
        AND lat != 0
        AND \`long\` != 0
    `;

    const params = [];

    // Bounds filter
    if (south && north && west && east) {
      query += ` 
        AND lat BETWEEN ? AND ? 
        AND \`long\` BETWEEN ? AND ?
      `;
      params.push(
        parseFloat(south), parseFloat(north),
        parseFloat(west), parseFloat(east)
      );
    }

    // Price filter (reserve_price)
    if (priceMin !== undefined && priceMax !== undefined) {
      query += ` AND reserve_price BETWEEN ? AND ?`;
      params.push(parseFloat(priceMin), parseFloat(priceMax));
    }

    // Property Type filter (Plots, Land, Flat, House, Villa, Commercial Building, Residential Building)
    if (type) {
      const arr = type.split(',');
      const placeholders = arr.map(() => '?').join(',');
      query += ` AND property_type IN (${placeholders})`;
      params.push(...arr);
    }

    // Bank Name filter
    if (bank_name) {
      const arr = bank_name.split(',');
      const placeholders = arr.map(() => '?').join(',');
      query += ` AND bank_name IN (${placeholders})`;
      params.push(...arr);
    }

    // Zoom-based limit
    const zoomLevel = parseInt(zoom) || 5;
    let finalLimit = Math.min(parseInt(limit), 20000);

    if (zoomLevel <= 7) {
      finalLimit = Math.min(finalLimit, 2000);
    } else if (zoomLevel <= 9) {
      finalLimit = Math.min(finalLimit, 5000);
    } else if (zoomLevel <= 12) {
      finalLimit = Math.min(finalLimit, 10000);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(finalLimit);

    const [properties] = await db.execute(query, params);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      propertyType: p.propertyType,
      bankName: p.bankName,
      actionType: p.actionType,
      price: p.price || 0,
      area: p.area || 0,
      units: p.units || 'Sq.ft',
      city: p.city || 'India',
      locality: p.locality || p.city || 'Location',
      fullLocation: p.fullLocation,
      possessionStatus: p.possessionStatus,
      emdAmount: p.emdAmount,
      auctionStart: p.auctionStart,
      auctionEnd: p.auctionEnd,
      description: p.description,
      status: p.status,
      listingStatus: p.listingStatus,
      created_at: p.created_at
    }));

    res.json({
      success: true,
      count: transformed.length,
      properties: transformed,
      zoom: zoomLevel,
      filters: {
        type: type || null,
        bank_name: bank_name || null
      }
    });

  } catch (error) {
    console.error('Auction map data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      properties: []
    });
  }
});

// Get filter options for auction properties
router.get('/auction/options/filters', async (req, res) => {
  try {
    // Get unique property_type values
    const [typeOptions] = await db.execute(`
      SELECT DISTINCT property_type as value, property_type as label 
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
      AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    // Get unique bank names
    const [bankOptions] = await db.execute(`
      SELECT DISTINCT bank_name as value, bank_name as label 
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
      AND bank_name IS NOT NULL AND bank_name != ''
      ORDER BY bank_name
    `);

    // Get price range (reserve_price)
    const [priceRange] = await db.execute(`
      SELECT 
        MIN(reserve_price) as min,
        MAX(reserve_price) as max
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
    `);

    // Get total count
    const [totalCount] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
    `);

    res.json({
      success: true,
      typeOptions: typeOptions,        // Property types
      bankOptions: bankOptions,        // Bank names
      priceRange: {
        min: priceRange[0]?.min || 0,
        max: priceRange[0]?.max || 1000000000
      },
      totalProperties: totalCount[0]?.total || 0
    });

  } catch (error) {
    console.error('Auction filter options error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single auction property by ID
router.get('/auction/property/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [property] = await db.execute(`
      SELECT 
        bankprop_id as id,
        auction_id,
        bank_name,
        property_type,
        action_type,
        location,
        city_town,
        area_town,
        lat,
        \`long\` as lng,
        area,
        units,
        possession,
        reserve_price,
        possession_status,
        emd_amount,
        bid_increment,
        emd_submission,
        auction_start_datetime,
        auction_end_datetime,
        bank_contact_details,
        description,
        status,
        created_at,
        updated_at,
        user_id_id
      FROM property_bankauctionproperty 
      WHERE bankprop_id = ?
    `, [id]);

    if (property.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.json({
      success: true,
      property: property[0]
    });

  } catch (error) {
    console.error('Error fetching auction property:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});







// Get best deals map properties
router.get('/bestdealsmap', async (req, res) => {
  const {
    south, north, west, east,
    type,              // property_type (PLOT, LAND, VILLA, APARTMENT)
    priceMin, priceMax,
    zoom,
    limit = 10000
  } = req.query;

  try {
    let query = `
      SELECT 
        deal_id as id,
        lat,
        \`long\` as lng,
        property_type as propertyType,
        budget as price,
        location,
        description,
        Admin_status as status,
        created_at,
        user_id_id,
        CASE 
          WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 'new'
          ELSE 'old'
        END as listingStatus
      FROM users_best_deals 
      WHERE Admin_status IN ('Approved')
        AND lat IS NOT NULL 
        AND \`long\` IS NOT NULL
        AND lat != 0
        AND \`long\` != 0
    `;

    const params = [];

    // Bounds filter
    if (south && north && west && east) {
      query += ` 
        AND lat BETWEEN ? AND ? 
        AND \`long\` BETWEEN ? AND ?
      `;
      params.push(
        parseFloat(south), parseFloat(north),
        parseFloat(west), parseFloat(east)
      );
    }

    // Price filter
    if (priceMin !== undefined && priceMax !== undefined) {
      query += ` AND budget BETWEEN ? AND ?`;
      params.push(parseFloat(priceMin), parseFloat(priceMax));
    }

    // Property Type filter
    if (type) {
      const arr = type.split(',');
      const placeholders = arr.map(() => '?').join(',');
      query += ` AND property_type IN (${placeholders})`;
      params.push(...arr);
    }

    // Zoom-based limit
    const zoomLevel = parseInt(zoom) || 5;
    let finalLimit = Math.min(parseInt(limit), 20000);

    if (zoomLevel <= 7) {
      finalLimit = Math.min(finalLimit, 2000);
    } else if (zoomLevel <= 9) {
      finalLimit = Math.min(finalLimit, 5000);
    } else if (zoomLevel <= 12) {
      finalLimit = Math.min(finalLimit, 10000);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(finalLimit);

    const [properties] = await db.execute(query, params);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      propertyType: p.propertyType,
      price: p.price || 0,
      location: p.location,
      description: p.description,
      status: p.status,
      listingStatus: p.listingStatus,
      created_at: p.created_at,
      userId: p.user_id_id
    }));

    res.json({
      success: true,
      count: transformed.length,
      properties: transformed,
      zoom: zoomLevel,
      filters: {
        type: type || null
      }
    });

  } catch (error) {
    console.error('Best deals map data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      properties: []
    });
  }
});

// Get filter options for best deals
router.get('/bestdeals/options/filters', async (req, res) => {
  try {
    // Get unique property_type values
    const [typeOptions] = await db.execute(`
      SELECT DISTINCT property_type as value, property_type as label 
      FROM users_best_deals 
      WHERE Admin_status = 'Approved'
      AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    // Get price range
    const [priceRange] = await db.execute(`
      SELECT 
        MIN(budget) as min,
        MAX(budget) as max
      FROM users_best_deals 
      WHERE Admin_status = 'Approved'
    `);

    // Get total count
    const [totalCount] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM users_best_deals 
      WHERE Admin_status = 'Approved'
    `);

    res.json({
      success: true,
      typeOptions: typeOptions,
      priceRange: {
        min: priceRange[0]?.min || 0,
        max: priceRange[0]?.max || 1000000000
      },
      totalProperties: totalCount[0]?.total || 0
    });

  } catch (error) {
    console.error('Best deals filter options error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single best deal by ID
router.get('/bestdeals/property/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [property] = await db.execute(`
      SELECT 
        deal_id as id,
        property_type,
        budget as price,
        location,
        lat,
        \`long\` as lng,
        description,
        Admin_status as status,
        created_at,
        updated_at,
        user_id_id
      FROM users_best_deals 
      WHERE deal_id = ?
    `, [id]);

    if (property.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.json({
      success: true,
      property: property[0]
    });

  } catch (error) {
    console.error('Error fetching best deal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



module.exports = router;