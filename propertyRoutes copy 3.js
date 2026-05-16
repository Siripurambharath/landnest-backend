const express = require("express");
const { db } = require('./server');
// const redisClient = require("./redisClient");
const router = express.Router();   




// Get auction properties map - FIXED
router.get('/auctionpropertymap', async (req, res) => {
  const {
    south, north, west, east,
    type,              
    bank_name,
    priceMin, priceMax,
    zoom,
    limit = 10000
  } = req.query;

  console.log('🔍 Auction Map request received:', { 
    south, north, west, east, 
    type, bank_name, 
    priceMin, priceMax, 
    zoom 
  });

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

    // Price filter - FIXED: Better validation
    const minPrice = priceMin !== undefined && priceMin !== null && priceMin !== '' ? parseFloat(priceMin) : null;
    const maxPrice = priceMax !== undefined && priceMax !== null && priceMax !== '' ? parseFloat(priceMax) : null;
    
    if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
      query += ` AND reserve_price BETWEEN ? AND ?`;
      params.push(minPrice, maxPrice);
    }

    // Property Type filter - FIXED: Handle empty strings
    if (type && type.trim() !== '') {
      const arr = type.split(',').filter(t => t && t.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND property_type IN (${placeholders})`;
        params.push(...arr);
      }
    }

    // Bank Name filter - FIXED: Handle empty strings
    if (bank_name && bank_name.trim() !== '') {
      const arr = bank_name.split(',').filter(b => b && b.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND bank_name IN (${placeholders})`;
        params.push(...arr);
      }
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

    // Debug log
    console.log('Auction SQL Query:', query);
    console.log('Auction Params count:', params.length);
    console.log('Auction Params:', params);

    // FIXED: Changed from db.execute to db.query
    const [properties] = await db.query(query, params);

    console.log(`Found ${properties.length} auction properties`);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      propertyType: p.propertyType,
      bankName: p.bankName,
      actionType: p.actionType,
      price: parseFloat(p.price) || 0,
      area: parseFloat(p.area) || 0,
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

// Get filter options for auction properties - FIXED
router.get('/auction/options/filters', async (req, res) => {
  try {
    console.log('Fetching auction filter options');
    
    // FIXED: Changed from db.execute to db.query
    const [typeOptions] = await db.query(`
      SELECT DISTINCT property_type as value, property_type as label 
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
      AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    // FIXED: Changed from db.execute to db.query
    const [bankOptions] = await db.query(`
      SELECT DISTINCT bank_name as value, bank_name as label 
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
      AND bank_name IS NOT NULL AND bank_name != ''
      ORDER BY bank_name
    `);

    // FIXED: Changed from db.execute to db.query
    const [priceRange] = await db.query(`
      SELECT 
        MIN(reserve_price) as min,
        MAX(reserve_price) as max
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
    `);

    // FIXED: Changed from db.execute to db.query
    const [totalCount] = await db.query(`
      SELECT COUNT(*) as total 
      FROM property_bankauctionproperty 
      WHERE status IN ('Pending', 'Approved')
    `);

    console.log('Auction filter options fetched successfully');
    console.log('Type options count:', typeOptions.length);
    console.log('Bank options count:', bankOptions.length);
    console.log('Total properties:', totalCount[0]?.total);

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

// Get single auction property by ID - FIXED
router.get('/auction/property/:id', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching auction property with ID: ${id}`);
    
    // FIXED: Changed from db.execute to db.query
    const [property] = await db.query(`
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

// Get best deals map properties - FIXED
router.get('/bestdealsmap', async (req, res) => {
  const {
    south, north, west, east,
    type,              // property_type (PLOT, LAND, VILLA, APARTMENT)
    priceMin, priceMax,
    zoom,
    limit = 10000
  } = req.query;

  console.log('🔍 Best Deals Map request:', { south, north, west, east, type, priceMin, priceMax, zoom });

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

    // Bounds filter - ALWAYS add if bounds are provided
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

    // Price filter - ONLY add if both min and max are valid
    const minPrice = priceMin !== undefined && priceMin !== null && priceMin !== '' && priceMin !== 'undefined' ? parseFloat(priceMin) : null;
    const maxPrice = priceMax !== undefined && priceMax !== null && priceMax !== '' && priceMax !== 'undefined' ? parseFloat(priceMax) : null;
    
    if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
      query += ` AND budget BETWEEN ? AND ?`;
      params.push(minPrice, maxPrice);
    }

    // Property Type filter - ONLY add if type has valid values
    if (type && type !== 'undefined' && type.trim() !== '') {
      const arr = type.split(',').filter(t => t && t.trim() && t !== 'undefined');
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND property_type IN (${placeholders})`;
        params.push(...arr);
      }
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

    // Debug log
    console.log('Best Deals SQL Query:', query);
    console.log('Best Deals Params count:', params.length);
    console.log('Best Deals Params:', params);

    // FIXED: Changed from db.execute to db.query
    const [properties] = await db.query(query, params);

    console.log(`Found ${properties.length} best deals properties`);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      propertyType: p.propertyType,
      price: parseFloat(p.price) || 0,
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

// Get filter options for best deals - FIXED
router.get('/bestdeals/options/filters', async (req, res) => {
  try {
    console.log('Fetching best deals filter options');
    
    // FIXED: Changed from db.execute to db.query
    const [typeOptions] = await db.query(`
      SELECT DISTINCT property_type as value, property_type as label 
      FROM users_best_deals 
      WHERE Admin_status = 'Approved'
      AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    // FIXED: Changed from db.execute to db.query
    const [priceRange] = await db.query(`
      SELECT 
        MIN(budget) as min,
        MAX(budget) as max
      FROM users_best_deals 
      WHERE Admin_status = 'Approved'
    `);

    // FIXED: Changed from db.execute to db.query
    const [totalCount] = await db.query(`
      SELECT COUNT(*) as total 
      FROM users_best_deals 
      WHERE Admin_status = 'Approved'
    `);

    console.log('Best deals filter options fetched successfully');
    console.log('Type options count:', typeOptions.length);
    console.log('Price range:', priceRange[0]);
    console.log('Total properties:', totalCount[0]?.total);

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

// Get single best deal by ID - FIXED
router.get('/bestdeals/property/:id', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching best deal property with ID: ${id}`);
    
    // FIXED: Changed from db.execute to db.query
    const [properties] = await db.query(`
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

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Property not found with ID: ${id}`
      });
    }

    const property = properties[0];
    
    // Convert string numbers to actual numbers
    if (property.price) property.price = parseFloat(property.price);
    if (property.lat) property.lat = parseFloat(property.lat);
    if (property.lng) property.lng = parseFloat(property.lng);

    res.json({
      success: true,
      property: property
    });

  } catch (error) {
    console.error('Error fetching best deal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.get('/:id/images', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    console.log(`Fetching images for property ID: ${propertyId}`); // Debug log
    
    // Check if property exists
    const [propertyExists] = await db.query(
      'SELECT property_id FROM property_property_images WHERE property_id = ?',
      [propertyId]
    );
    
    if (propertyExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      }); 
    }
    
    const [images] = await db.query(
      'SELECT id, image FROM property_property_images WHERE property_id = ? ORDER BY id',
      [propertyId]
    );
    
    console.log(`Found ${images.length} images for property ${propertyId}`);
    
    res.json({
      success: true,
      images: images.map(img => img.image)
    });
  } catch (error) {
    console.error('Error fetching property images:', error);
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


// Get map properties with all fields
router.get('/map', async (req, res) => {
  const {
    south, north, west, east,
    type,                // sell / rent / lease
    propertyType,        // property_type
    zoom,
    priceMin, priceMax,
    limit = 10000
  } = req.query;

  console.log('🔍 Backend /map received params:', {
    type, propertyType, priceMin, priceMax,
    south, north, west, east
  });

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
        category_id_id,
        CASE 
          WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 'new_launch'
          ELSE 'ready'
        END as listing_status
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

    // Price filter - FIXED: Check if values exist and are valid numbers
    const minPriceVal = priceMin !== undefined && priceMin !== null && priceMin !== '' ? parseFloat(priceMin) : null;
    const maxPriceVal = priceMax !== undefined && priceMax !== null && priceMax !== '' ? parseFloat(priceMax) : null;
    
    if (minPriceVal !== null && maxPriceVal !== null && !isNaN(minPriceVal) && !isNaN(maxPriceVal)) {
      query += ` AND COALESCE(price, min_budget) BETWEEN ? AND ?`;
      params.push(minPriceVal, maxPriceVal);
    }

    // Property Type filter - FIXED: Handle empty strings
    if (propertyType && propertyType.trim() !== '') {
      const arr = propertyType.split(',').filter(p => p && p.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND property_type IN (${placeholders})`;
        params.push(...arr);
      }
    }

    // Listing Type filter - FIXED: Handle empty strings
    if (type && type.trim() !== '') {
      const arr = type.split(',').filter(t => t && t.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND type IN (${placeholders})`;
        params.push(...arr);
      }
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

    // DEBUG: Log the query and params
    console.log('SQL Query:', query);
    console.log('Params count:', params.length);
    console.log('Params values:', params);

    // FIXED: Use db.query instead of db.execute for consistency
    const [properties] = await db.query(query, params);

    console.log(`Found ${properties.length} properties`);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      title: p.title,
      propertyType: p.property_type,
      listingType: p.listingType,
      price: parseFloat(p.price) || 0,
      minBudget: p.min_budget,
      maxBudget: p.max_budget,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      location: p.location,
      locality: p.locality,
      buildupArea: p.buildup_area,
      siteArea: p.site_area,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      floor: p.floor,
      facing: p.facing,
      description: p.description,
      postedBy: p.posted_by,
      mobileNo: p.mobile_no,
      adminMobile: p.admin_mobile,
      minAcres: p.min_acres,
      maxAcres: p.max_acres,
      ratio: p.ratio,
      comment: p.comment,
      roadwidth: p.roadwidth,
      length: p.length,
      width: p.width,
      units: p.units,
      noOfFlores: p.no_of_flores,
      _1bhkCount: p._1bhk_count,
      _2bhkCount: p._2bhk_count,
      _3bhkCount: p._3bhk_count,
      _4bhkCount: p._4bhk_count,
      roomsCount: p.rooms_count,
      duplexBedrooms: p.duplex_bedrooms,
      shopCount: p.shop_count,
      houseCount: p.house_count,
      balcony: p.balcony,
      powerBackup: p.power_backup,
      gatedSecurity: p.gated_security,
      borewell: p.borewell,
      parking: p.parking,
      lift: p.lift,
      advancePayment: p.advance_payment,
      boostDate: p.boost_date,
      categoryId: p.category_id_id,
      listingStatus: p.listing_status,
      createdAt: p.created_at
    }));

    res.json({
      success: true,
      count: transformed.length,
      properties: transformed,
      zoom: zoomLevel
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

// Get property details by ID with all fields
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // FIXED: Changed from db.execute to db.query
    const [properties] = await db.query(`
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

router.get('/options/filters', async (req, res) => {
  try {
    const { type } = req.query; 
    
    console.log('Filter options requested for type:', type);
    
    let typeCondition = "";
    let queryParams = [];
    
    if (type && type.trim() !== '') {
      typeCondition = " AND type = ?";
      queryParams.push(type);
    }

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

    // FIXED: Changed from db.execute to db.query
    const [priceRange] = await db.query(`
      SELECT 
        MIN(COALESCE(price, min_budget, 0)) as min_price,
        MAX(COALESCE(price, max_budget, 1000000000)) as max_price
      FROM property_property 
      WHERE status = 1 
        AND Admin_status = 'Approved'
        ${typeCondition}
    `, queryParams);

    // FIXED: Changed from db.execute to db.query
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
        min: priceRange[0]?.min_price || 0,
        max: priceRange[0]?.max_price || 5000000000
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




//jv/jd api
// Get filter options for the new flow
router.get('/options/filters/new', async (req, res) => {
  try {
    // FIXED: Changed from db.execute to db.query
    const [typeOptions] = await db.query(`
      SELECT DISTINCT type as value, type as label 
      FROM property_property 
      WHERE status = 1 AND Admin_status = 'Approved'
      AND type IS NOT NULL AND type != ''
      ORDER BY type
    `);

    // FIXED: Changed from db.execute to db.query
    const [propertyTypeOptions] = await db.query(`
      SELECT DISTINCT property_type as value, property_type as label 
      FROM property_property 
      WHERE status = 1 AND Admin_status = 'Approved'
      AND property_type IS NOT NULL AND property_type != ''
      ORDER BY property_type
    `);

    // FIXED: Changed from db.execute to db.query
    const [priceRange] = await db.query(`
      SELECT 
        MIN(COALESCE(price, min_budget)) as min,
        MAX(COALESCE(price, min_budget)) as max
      FROM property_property 
      WHERE status = 1 AND Admin_status = 'Approved'
    `);

    // FIXED: Changed from db.execute to db.query
    const [totalCount] = await db.query(`
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

  console.log('🔍 JV/JD Map request:', { type, propertyType, priceMin, priceMax, south, north, west, east });

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

    // Price filter - FIXED: Better validation
    const minPrice = priceMin !== undefined && priceMin !== null && priceMin !== '' ? parseFloat(priceMin) : null;
    const maxPrice = priceMax !== undefined && priceMax !== null && priceMax !== '' ? parseFloat(priceMax) : null;
    
    if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
      query += ` AND COALESCE(price, min_budget) BETWEEN ? AND ?`;
      params.push(minPrice, maxPrice);
    }

    // ✅ Main Category filter (jvjd or built to suit) - filters type column
    if (type && type.trim() !== '') {
      const arr = type.split(',').filter(t => t && t.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND type IN (${placeholders})`;
        params.push(...arr);
      }
    }

    // ✅ Sub Category filter (plot or land) - filters property_type column
    if (propertyType && propertyType.trim() !== '') {
      const arr = propertyType.split(',').filter(pt => pt && pt.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND property_type IN (${placeholders})`;
        params.push(...arr);
      }
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

    // Debug log
    console.log('JV/JD SQL Query:', query);
    console.log('JV/JD Params count:', params.length);
    console.log('JV/JD Params:', params);

    // FIXED: Changed from db.execute to db.query
    const [properties] = await db.query(query, params);

    console.log(`Found ${properties.length} properties for JV/JD`);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      propertyType: p.propertyType || 'plot',
      listingType: p.listingType || 'jvjd',
      price: parseFloat(p.price) || 0,
      area: parseFloat(p.area) || 1000,
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
    console.error('JV/JD Map data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      properties: []
    });
  }
});








// Get best deals map properties



module.exports = router;