const express = require("express");
const { db } = require('./server');
const router = express.Router();   

router.get('/all', async (req, res) => {
  try {
    const query = `
      SELECT
        p.*,
        p.type AS listingType
      FROM property_property p
      WHERE p.type = 'sell'
    `;

    const [rows] = await db.execute(query);

    const [countResult] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM property_property p
      WHERE p.type = 'sell'
    `);

    res.json({
      success: true,
      total: countResult[0].total,
      count: rows.length,
      properties: rows
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.get('/property-locations', async (req, res) => {
  try {

    const [rows] = await db.execute(`
      SELECT 
        property_id,
        property_name,
        type,
        lat,
        \`long\`
      FROM property_property
      WHERE lat IS NOT NULL
      AND \`long\` IS NOT NULL
      LIMIT 5
    `);

    res.json({
      success: true,
      count: rows.length,
      properties: rows
    });

  } catch (error) {

    console.error("Error fetching properties:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



router.get('/prime/map', async (req, res) => {
  const {
    south, north, west, east,
    zoom,
    priceMin, priceMax,
    propertyType,
    limit = 10000
  } = req.query;

  try {
    let query = `
      SELECT 
        p.property_id as id,
        p.property_name as title,
        p.type as listingType,
        COALESCE(p.price, p.min_budget) as price,
        p.min_budget,
        p.max_budget,
        p.lat,
        p.\`long\` as lng,
        p.location,
        p.nearby as locality,
        p.buildup_area,
        p.site_area,
        p.bedrooms_count as bedrooms,
        p.bathrooms_count as bathrooms,
        p.floor,
        p.facing,
        p.description,
        p.status,
        p.Admin_status,
        p.user_id_id,
        p.posted_by,
        p.created_at,
        p.updated_at,
        p.mobile_no,
        p.admin_mobile,
        p.min_acres,
        p.max_acres,
        p.ratio,
        p.comment,
        p.roadwidth,
        p.length,
        p.width,
        p.units,
        p.no_of_flores,
        p._1bhk_count,
        p._2bhk_count,
        p._3bhk_count,
        p._4bhk_count,
        p.rooms_count,
        p.duplex_bedrooms,
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
        p.category_id_id,
        c.category as categoryName,
        CASE 
          WHEN DATEDIFF(NOW(), p.created_at) <= 7 THEN 'new_launch'
          ELSE 'ready'
        END as listing_status
      FROM property_property p
      LEFT JOIN property_property_cat c 
        ON c.category_id = p.category_id_id 
        AND c.category_type = p.type
      WHERE p.posted_by = 'Admin'
        AND p.type = 'sell'
        AND p.lat IS NOT NULL 
        AND p.\`long\` IS NOT NULL
        AND p.lat != ''
        AND p.\`long\` != ''
        AND TRIM(p.lat) != ''
        AND TRIM(p.\`long\`) != ''
    `;

    const params = [];

    // Bounds filter (map movement) - OPTIONAL
    if (south && north && west && east && 
        south !== 'undefined' && north !== 'undefined' && 
        west !== 'undefined' && east !== 'undefined') {
      query += ` 
        AND CAST(p.lat AS DECIMAL(10,6)) BETWEEN ? AND ? 
        AND CAST(p.\`long\` AS DECIMAL(10,6)) BETWEEN ? AND ?
      `;
      params.push(
        parseFloat(south), parseFloat(north),
        parseFloat(west), parseFloat(east)
      );
    }

    // Price filter - OPTIONAL
    const minPriceVal = priceMin && priceMin !== 'undefined' && priceMin !== '' ? parseFloat(priceMin) : null;
    const maxPriceVal = priceMax && priceMax !== 'undefined' && priceMax !== '' ? parseFloat(priceMax) : null;

    if (minPriceVal !== null && maxPriceVal !== null && !isNaN(minPriceVal) && !isNaN(maxPriceVal)) {
      query += ` AND COALESCE(p.price, p.min_budget) BETWEEN ? AND ?`;
      params.push(minPriceVal, maxPriceVal);
    }

    // Category filter - OPTIONAL - FIXED to handle NULL categories
    if (propertyType && propertyType !== 'undefined' && propertyType.trim() !== '') {
      const arr = propertyType.split(',').filter(p => p && p.trim() && p !== 'undefined');
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND c.category IN (${placeholders})`;
        params.push(...arr);
      }
    }

    // Zoom-based limit
    const zoomLevel = parseInt(zoom) || 5;
    let finalLimit = Math.min(parseInt(limit), 20000);

    if (zoomLevel <= 7) finalLimit = Math.min(finalLimit, 2000);
    else if (zoomLevel <= 9) finalLimit = Math.min(finalLimit, 5000);
    else if (zoomLevel <= 12) finalLimit = Math.min(finalLimit, 10000);

    query += ` ORDER BY p.created_at DESC LIMIT ?`;
    params.push(finalLimit);

    console.log('Executing query with params:', params);
    const [properties] = await db.query(query, params);
    
    console.log(`Found ${properties.length} properties`);

    const transformed = properties.map(p => ({
      id: p.id,
      title: p.title,
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
      status: p.status,
      userId: p.user_id_id,
      postedBy: p.posted_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
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
      categoryName: p.categoryName || null,
      listingStatus: p.listing_status
    }));

    res.json({
      success: true,
      count: transformed.length,
      properties: transformed,
      zoom: zoomLevel
    });

  } catch (error) {
    console.error('Prime map error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      properties: []
    });
  }
});


router.get('/prime/options/filters', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT DISTINCT 
        c.category_id as id,
        c.category as value,
        c.category as label
      FROM property_property_cat c
      INNER JOIN property_property p
        ON p.category_id_id = c.category_id
        AND p.type = c.category_type
      WHERE c.category IS NOT NULL
        AND c.category != ''
      
        AND p.posted_by = 'Admin'
        AND p.type = 'sell'
      ORDER BY c.category
    `);

    const [priceRange] = await db.query(`
      SELECT 
        MIN(COALESCE(p.price, p.min_budget, 0)) as min_price,
        MAX(COALESCE(p.price, p.max_budget, 1000000000)) as max_price
      FROM property_property p
      WHERE p.posted_by = 'Admin'
        AND p.type = 'sell'
    `);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM property_property p
      WHERE p.posted_by = 'Admin'
        AND p.type = 'sell'
        AND p.lat IS NOT NULL 
        AND p.\`long\` IS NOT NULL
        AND p.lat != ''
        AND p.\`long\` != ''
    `);

    res.json({
      success: true,
      categories,
      priceRange: {
        min: priceRange[0]?.min_price || 0,
        max: priceRange[0]?.max_price || 5000000000
      },
      totalProperties: countResult[0]?.total || 0
    });

  } catch (error) {
    console.error('Prime filter options error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
    WHERE status = 'Approved'
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
router.get('/auction/options/filters', async (req, res) => {
  try {
    console.log('Fetching auction filter options');

    // Property Types
    const [typeOptions] = await db.query(`
      SELECT DISTINCT 
        property_type as value, 
        property_type as label 
      FROM property_bankauctionproperty 
      WHERE status = 'Approved'
        AND property_type IS NOT NULL 
        AND property_type != ''
      ORDER BY property_type
    `);

    // Bank Names
    const [bankOptions] = await db.query(`
      SELECT DISTINCT 
        bank_name as value, 
        bank_name as label 
      FROM property_bankauctionproperty 
      WHERE status = 'Approved'
        AND bank_name IS NOT NULL 
        AND bank_name != ''
      ORDER BY bank_name
    `);

    // Price Range
    const [priceRange] = await db.query(`
      SELECT 
        MIN(reserve_price) as min,
        MAX(reserve_price) as max
      FROM property_bankauctionproperty 
      WHERE status = 'Approved'
    `);

    // Total Count
    const [totalCount] = await db.query(`
      SELECT COUNT(*) as total 
      FROM property_bankauctionproperty 
      WHERE status = 'Approved'
    `);

    console.log('Auction filter options fetched successfully');
    console.log('Type options count:', typeOptions.length);
    console.log('Bank options count:', bankOptions.length);
    console.log('Total approved properties:', totalCount[0]?.total);

    res.json({
      success: true,
      typeOptions,
      bankOptions,
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





router.get('/bestdealsmap', async (req, res) => {
  const {
    south, north, west, east,
    type,
    propertyType,
    zoom,
    priceMin, priceMax,
    limit = 10000
  } = req.query;

  console.log('🔍 Best Deals Map request:', { south, north, west, east, type, propertyType, priceMin, priceMax, zoom });

  try {
    let query = `
      SELECT 
        p.property_id as id,
        p.property_name as title,
        p.property_type,
        p.type as listingType,
        COALESCE(p.price, p.min_budget) as price,
        p.min_budget,
        p.max_budget,
        p.lat,
        p.\`long\` as lng,
        p.location,
        p.nearby as locality,
        p.buildup_area,
        p.site_area,
        p.bedrooms_count as bedrooms,
        p.bathrooms_count as bathrooms,
        p.floor,
        p.facing,
        p.description,
        p.status,
        p.Admin_status,
        p.user_id_id,
        p.posted_by,
        p.created_at,
        p.updated_at,
        p.mobile_no,
        p.admin_mobile,
        p.min_acres,
        p.max_acres,
        p.ratio,
        p.comment,
        p.roadwidth,
        p.length,
        p.width,
        p.units,
        p.no_of_flores,
        p._1bhk_count,
        p._2bhk_count,
        p._3bhk_count,
        p._4bhk_count,
        p.rooms_count,
        p.duplex_bedrooms,
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
        p.category_id_id,
        c.category as categoryName,
        CASE 
          WHEN DATEDIFF(NOW(), p.created_at) <= 7 THEN 'new_launch'
          ELSE 'ready'
        END as listing_status
      FROM property_property p
      LEFT JOIN property_property_cat c 
        ON c.category_id = p.category_id_id 
        AND c.category_type = p.type
      WHERE p.Admin_status = 'Approved'
        AND p.type = 'best-deal'
        AND p.lat IS NOT NULL 
        AND p.\`long\` IS NOT NULL
        AND p.lat != ''
        AND p.\`long\` != ''
        AND TRIM(p.lat) != ''
        AND TRIM(p.\`long\`) != ''
    `;

    const params = [];

    // Bounds filter
    if (south && north && west && east) {
      query += ` 
        AND CAST(p.lat AS DECIMAL(10,6)) BETWEEN ? AND ? 
        AND CAST(p.\`long\` AS DECIMAL(10,6)) BETWEEN ? AND ?
      `;
      params.push(
        parseFloat(south), parseFloat(north),
        parseFloat(west), parseFloat(east)
      );
    }

    // Price filter
    const minPriceVal = priceMin !== undefined && priceMin !== null && priceMin !== '' && priceMin !== 'undefined' ? parseFloat(priceMin) : null;
    const maxPriceVal = priceMax !== undefined && priceMax !== null && priceMax !== '' && priceMax !== 'undefined' ? parseFloat(priceMax) : null;

    if (minPriceVal !== null && maxPriceVal !== null && !isNaN(minPriceVal) && !isNaN(maxPriceVal)) {
      query += ` AND COALESCE(p.price, p.min_budget) BETWEEN ? AND ?`;
      params.push(minPriceVal, maxPriceVal);
    }

    // Category filter (using categoryName from joined table)
    if (propertyType && propertyType.trim() !== '') {
      const arr = propertyType.split(',').filter(cat => cat && cat.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND c.category IN (${placeholders})`;
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

    query += ` ORDER BY p.created_at DESC LIMIT ?`;
    params.push(finalLimit);

    console.log('Best Deals SQL Query:', query);
    console.log('Best Deals Params count:', params.length);
    console.log('Best Deals Params:', params);

    const [properties] = await db.query(query, params);

    console.log(`Found ${properties.length} best deals properties`);

    // Fetch images for all properties in a single query
    const propertyIds = properties.map(p => p.id);
    let imagesMap = new Map();
    
    if (propertyIds.length > 0) {
      const placeholders = propertyIds.map(() => '?').join(',');
      const [allImages] = await db.query(
        `SELECT property_id, image FROM property_property_images WHERE property_id IN (${placeholders}) ORDER BY id`,
        propertyIds
      );
      
      // Group images by property_id
      allImages.forEach(img => {
        if (!imagesMap.has(img.property_id)) {
          imagesMap.set(img.property_id, []);
        }
        imagesMap.get(img.property_id).push(img.image);
      });
    }
    const CATEGORY_ID_TO_NAME = {
  57: 'Plot',
  79: 'Land',
  66: 'Apartment',
  76: 'Villa',
};

    // Transform response with images
    const transformed = properties.map(p => ({
      id: p.id,
      title: p.title,
      propertyType: p.categoryName || p.property_type, // Use categoryName if available
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
      categoryName: p.categoryName || CATEGORY_ID_TO_NAME[p.category_id_id] || null,
      listingStatus: p.listing_status,
      createdAt: p.created_at,
      
    }));

    res.json({
      success: true,
      count: transformed.length,
      properties: transformed,
      zoom: zoomLevel
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


router.get('/bestdeals/options/filters', async (req, res) => {
  try {
    const { type } = req.query;

    console.log('Best deals filter options requested for type:', type);

    // Get categories from category table for best-deal type
    const [categories] = await db.query(`
      SELECT DISTINCT 
        c.category as value,
        c.category as label
      FROM property_property_cat c
      INNER JOIN property_property p 
        ON p.category_id_id = c.category_id 
        AND p.type = c.category_type
      WHERE c.category IS NOT NULL
        AND c.category != ''
        AND p.Admin_status = 'Approved'
        AND p.type = 'best-deal'
        AND p.status = 1
        ${type && type.trim() !== '' ? 'AND c.category_type = ?' : ''}
      ORDER BY c.category
    `, type && type.trim() !== '' ? [type] : []);

    // Get price range for best-deal properties
    const [priceRange] = await db.query(`
      SELECT 
        MIN(COALESCE(p.price, p.min_budget, 0)) as min_price,
        MAX(COALESCE(p.price, p.max_budget, 1000000000)) as max_price
      FROM property_property p
      WHERE p.status = 1 
        AND p.Admin_status = 'Approved'
        AND p.type = 'best-deal'
        ${type && type.trim() !== '' ? 'AND p.type = ?' : ''}
    `, type && type.trim() !== '' ? [type] : []);

    // Get total count of best-deal properties
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM property_property p
      WHERE p.status = 1 
        AND p.Admin_status = 'Approved'
        AND p.type = 'best-deal'
        ${type && type.trim() !== '' ? 'AND p.type = ?' : ''}
    `, type && type.trim() !== '' ? [type] : []);

    console.log('Best deals categories found:', categories.length);
    console.log('Best deals price range:', priceRange[0]);
    console.log('Best deals total count:', countResult[0]?.total);

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
    console.error('Best deals filter options error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


router.get('/bestdeals/property/:id', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching best deal property with ID: ${id}`);

    const [properties] = await db.query(`
      SELECT 
        p.property_id as id,
        p.property_name as title,
        p.property_type,
        p.type as listingType,
        COALESCE(p.price, p.min_budget) as price,
        p.min_budget,
        p.max_budget,
        p.lat,
        p.\`long\` as lng,
        p.location,
        p.nearby as locality,
        p.buildup_area,
        p.site_area,
        p.bedrooms_count as bedrooms,
        p.bathrooms_count as bathrooms,
        p.floor,
        p.facing,
        p.description,
        p.status,
        p.Admin_status,
        p.user_id_id,
        p.posted_by,
        p.created_at,
        p.updated_at,
        p.mobile_no,
        p.admin_mobile,
        p.min_acres,
        p.max_acres,
        p.ratio,
        p.comment,
        p.roadwidth,
        p.length,
        p.width,
        p.units,
        p.no_of_flores,
        p._1bhk_count,
        p._2bhk_count,
        p._3bhk_count,
        p._4bhk_count,
        p.rooms_count,
        p.duplex_bedrooms,
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
        p.category_id_id,
        c.category as categoryName
      FROM property_property p
      LEFT JOIN property_property_cat c 
        ON c.category_id = p.category_id_id 
        AND c.category_type = p.type
      WHERE p.property_id = ?
        AND p.type = 'best-deal'
    `, [id]);

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Best deal property not found with ID: ${id}`
      });
    }

    const property = properties[0];

    // Get images
    const [images] = await db.query(
      'SELECT image FROM property_property_images WHERE property_id = ? ORDER BY id',
      [id]
    );

    property.images = images.map(img => img.image);

    // Convert numeric strings
    if (property.price) property.price = parseFloat(property.price);
    if (property.lat)   property.lat   = parseFloat(property.lat);
    if (property.lng)   property.lng   = parseFloat(property.lng);

    res.json({
      success: true,
      property: property
    });

  } catch (error) {
    console.error('Error fetching best deal property:', error);
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


router.get('/map', async (req, res) => {
  const {
    south, north, west, east,
    type,
    propertyType,
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
        p.property_id as id,
        p.property_name as title,
        
        p.type as listingType,
        COALESCE(p.price, p.min_budget) as price,
        p.min_budget,
        p.max_budget,
        p.lat,
        p.\`long\` as lng,
        p.location,
        p.nearby as locality,
        p.buildup_area,
        p.site_area,
        p.bedrooms_count as bedrooms,
        p.bathrooms_count as bathrooms,
        p.floor,
        p.facing,
        p.description,
        p.status,
        p.Admin_status,
        p.user_id_id,
        p.posted_by,
        p.created_at,
        p.updated_at,
        p.mobile_no,
        p.admin_mobile,
        p.min_acres,
        p.max_acres,
        p.ratio,
        p.comment,
        p.roadwidth,
        p.length,
        p.width,
        p.units,
        p.no_of_flores,
        p._1bhk_count,
        p._2bhk_count,
        p._3bhk_count,
        p._4bhk_count,
        p.rooms_count,
        p.duplex_bedrooms,
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
        p.category_id_id,
        c.category as categoryName,
        CASE 
          WHEN DATEDIFF(NOW(), p.created_at) <= 7 THEN 'new_launch'
          ELSE 'ready'
        END as listing_status
      FROM property_property p
      LEFT JOIN property_property_cat c 
        ON c.category_id = p.category_id_id 
        AND (
          (c.category_type = 'sell' AND p.type = 'sell')
          OR 
          (c.category_type = 'rent/lease' AND p.type IN ('rent', 'lease'))
        )
      WHERE p.Admin_status = 'Approved'
        AND p.lat IS NOT NULL 
        AND p.\`long\` IS NOT NULL
        AND p.lat != ''
        AND p.\`long\` != ''
        AND TRIM(p.lat) != ''
        AND TRIM(p.\`long\`) != ''
    `;

    const params = [];

    // Bounds filter
    if (south && north && west && east) {
      query += ` 
        AND CAST(p.lat AS DECIMAL(10,6)) BETWEEN ? AND ? 
        AND CAST(p.\`long\` AS DECIMAL(10,6)) BETWEEN ? AND ?
      `;
      params.push(
        parseFloat(south), parseFloat(north),
        parseFloat(west), parseFloat(east)
      );
    }

    // Price filter
    const minPriceVal = priceMin !== undefined && priceMin !== null && priceMin !== '' ? parseFloat(priceMin) : null;
    const maxPriceVal = priceMax !== undefined && priceMax !== null && priceMax !== '' ? parseFloat(priceMax) : null;

    if (minPriceVal !== null && maxPriceVal !== null && !isNaN(minPriceVal) && !isNaN(maxPriceVal)) {
      query += ` AND COALESCE(p.price, p.min_budget) BETWEEN ? AND ?`;
      params.push(minPriceVal, maxPriceVal);
    }

    // Category filter
    if (propertyType && propertyType.trim() !== '') {
      const arr = propertyType.split(',').filter(p => p && p.trim());

      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND c.category IN (${placeholders})`;
        params.push(...arr);
      }
    }

    // Listing Type filter
    if (type && type.trim() !== '') {
      const arr = type.split(',').filter(t => t && t.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND p.type IN (${placeholders})`;
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

    query += ` ORDER BY p.created_at DESC LIMIT ?`;
    params.push(finalLimit);

    console.log('SQL Query:', query);
    console.log('Params count:', params.length);
    console.log('Params values:', params);

    const [properties] = await db.query(query, params);

    console.log(`Found ${properties.length} properties`);

    // Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      title: p.title,
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
      categoryName: p.categoryName || null,   
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


router.get('/options/filters', async (req, res) => {
  try {
    const { type } = req.query;

    console.log('Filter options requested for type:', type);

    let categoryTypeFilter = type;
    if (type === 'rent' || type === 'lease') {
      categoryTypeFilter = 'rent/lease';
    }

    // ✅ Get ALL categories from category table
    const [categories] = await db.query(`
      SELECT DISTINCT 
        c.category as value,
        c.category as label
      FROM property_property_cat c
      WHERE c.category IS NOT NULL
        AND c.category != ''
        ${categoryTypeFilter && categoryTypeFilter.trim() !== '' ? 'AND c.category_type = ?' : ''}
      ORDER BY c.category
    `, categoryTypeFilter && categoryTypeFilter.trim() !== '' ? [categoryTypeFilter] : []);

    let propertyTypeFilter = type;
    if (type === 'lease') {
      propertyTypeFilter = 'rent'; // properties with type='lease' also exist
    }

    const [priceRange] = await db.query(`
      SELECT 
        MIN(COALESCE(p.price, p.min_budget, 0)) as min_price,
        MAX(COALESCE(p.price, p.max_budget, 1000000000)) as max_price
      FROM property_property p
      WHERE p.status = 1 
        AND p.Admin_status = 'Approved'
        ${propertyTypeFilter && propertyTypeFilter.trim() !== '' ? 'AND p.type = ?' : ''}
    `, propertyTypeFilter && propertyTypeFilter.trim() !== '' ? [propertyTypeFilter] : []);

    // ✅ Total Properties Count
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM property_property p
      WHERE p.status = 1 
        AND p.Admin_status = 'Approved'
        ${propertyTypeFilter && propertyTypeFilter.trim() !== '' ? 'AND p.type = ?' : ''}
    `, propertyTypeFilter && propertyTypeFilter.trim() !== '' ? [propertyTypeFilter] : []);

    console.log('Categories found:', categories.length);
    console.log('Price range:', priceRange[0]);
    console.log('Total count:', countResult[0]?.total);

    res.json({
      success: true,
      categories,
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
      WHERE property_id = ? 
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





router.get('/options/filters/new', async (req, res) => {
  try {

    const [typeOptions] = await db.query(`
      SELECT DISTINCT type as value, type as label 
      FROM property_property 
      WHERE Admin_status = 'Approved'
      AND type IN ('jv/jd', 'build to suit')
      AND type IS NOT NULL 
      AND type != ''
      ORDER BY type
    `);

    const [propertyTypeOptions] = await db.query(`
      SELECT DISTINCT property_type as value, property_type as label 
      FROM property_property 
      WHERE Admin_status = 'Approved'
      AND type IN ('jv/jd', 'build to suit')
      AND property_type IS NOT NULL 
      AND property_type != ''
      ORDER BY property_type
    `);

    const [priceRange] = await db.query(`
      SELECT 
        MIN(COALESCE(price, min_budget)) as min,
        MAX(COALESCE(price, min_budget)) as max
      FROM property_property 
      WHERE Admin_status = 'Approved'
      AND type IN ('jv/jd', 'build to suit')
    `);

    const [totalCount] = await db.query(`
      SELECT COUNT(*) as total 
      FROM property_property 
      WHERE Admin_status = 'Approved'
      AND type IN ('jv/jd', 'build to suit')
    `);

    console.log('typeOptions:', typeOptions);
    console.log('propertyTypeOptions:', propertyTypeOptions);

    res.json({
      success: true,
      typeOptions,
      propertyTypeOptions,
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

router.get('/map/new', async (req, res) => {
  const {
    south, north, west, east,
    type,
    propertyType,
    zoom,
    priceMin,
    priceMax,
    limit = 10000
  } = req.query;

  console.log('🔍 JV/JD Map request:', {
    type, propertyType, priceMin, priceMax, south, north, west, east
  });

  try {
    let query = `
      SELECT 
        property_id as id,
        mobile_no,
        lat,
        \`long\` as lng,
        property_type as propertyType,
        type as listingType,
        price,
        min_budget,
        max_budget,
        min_acres,
        max_acres,
        ratio,
        floor,
        comment,
        facing,
        roadwidth,
        site_area,
        length,
        width,
        units,
        buildup_area as area,
        posted_by,
        location as city,
        property_name as title,
        nearby as locality,
        no_of_flores,
        _1bhk_count,
        _2bhk_count,
        _3bhk_count,
        _4bhk_count,
        rooms_count,
        duplex_bedrooms,
        bedrooms_count,
        bathrooms_count,
        shop_count,
        house_count,
        balcony,
        power_backup,
        gated_security,
        borewell,
        parking,
        lift,
        advance_payment,
        description,
        category_id_id,
        user_id_id,
        created_at,
        updated_at,
        COALESCE(price, min_budget) as effective_price,
        CASE 
          WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 'new_launch'
          ELSE 'ready'
        END as status
      FROM property_property 
      WHERE Admin_status = 'Approved'
        AND type IN ('jv/jd', 'build to suit')
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
      params.push(parseFloat(south), parseFloat(north), parseFloat(west), parseFloat(east));
    }

    // Price filter
    const minPrice = priceMin !== undefined && priceMin !== null && priceMin !== '' ? parseFloat(priceMin) : null;
    const maxPrice = priceMax !== undefined && priceMax !== null && priceMax !== '' ? parseFloat(priceMax) : null;

    if (minPrice !== null && maxPrice !== null && !isNaN(minPrice) && !isNaN(maxPrice)) {
      query += ` AND COALESCE(price, min_budget) BETWEEN ? AND ?`;
      params.push(minPrice, maxPrice);
    }

    // Main Category filter
    if (type && type.trim() !== '') {
      const arr = type.split(',').filter(t => t && t.trim());
      if (arr.length > 0) {
        const placeholders = arr.map(() => '?').join(',');
        query += ` AND type IN (${placeholders})`;
        params.push(...arr);
      }
    }

    // Sub Category filter
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

    if (zoomLevel <= 7) finalLimit = Math.min(finalLimit, 2000);
    else if (zoomLevel <= 9) finalLimit = Math.min(finalLimit, 5000);
    else if (zoomLevel <= 12) finalLimit = Math.min(finalLimit, 10000);

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(finalLimit);

    console.log('JV/JD SQL Query:', query);
    console.log('JV/JD Params:', params);

    const [properties] = await db.query(query, params);
    console.log(`Found ${properties.length} properties`);

    const transformed = properties.map(p => ({
      id: p.id,
      mobileNo: p.mobile_no,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      propertyType: p.propertyType || 'plot',
      listingType: p.listingType || 'jvjd',

      // Pricing
      price: parseFloat(p.price) || null,
      minBudget: parseFloat(p.min_budget) || null,
      maxBudget: parseFloat(p.max_budget) || null,
      effectivePrice: parseFloat(p.effective_price) || 0,

      // Land/Area details
      minAcres: parseFloat(p.min_acres) || null,
      maxAcres: parseFloat(p.max_acres) || null,
      siteArea: parseFloat(p.site_area) || null,
      area: parseFloat(p.area) || null,
      length: parseFloat(p.length) || null,
      width: parseFloat(p.width) || null,
      units: p.units || null,
      roadwidth: parseFloat(p.roadwidth) || null,

      // Property details
      ratio: p.ratio || null,
      floor: p.floor || null,
      noOfFlores: p.no_of_flores || null,
      facing: p.facing || null,
      postedBy: p.posted_by || null,
      advancePayment: parseFloat(p.advance_payment) || null,

      // Unit counts
      bhk1Count: p._1bhk_count || 0,
      bhk2Count: p._2bhk_count || 0,
      bhk3Count: p._3bhk_count || 0,
      bhk4Count: p._4bhk_count || 0,
      roomsCount: p.rooms_count || 0,
      duplexBedrooms: p.duplex_bedrooms || 0,
      bedroomsCount: p.bedrooms_count || 0,
      bathroomsCount: p.bathrooms_count || 0,
      shopCount: p.shop_count || 0,
      houseCount: p.house_count || 0,

      // Amenities
      balcony: p.balcony || null,
      powerBackup: p.power_backup || null,
      gatedSecurity: p.gated_security || null,
      borewell: p.borewell || null,
      parking: p.parking || null,
      lift: p.lift || null,

      // Location
      city: p.city || 'India',
      locality: p.locality || p.city || 'Location',
      title: p.title || `${p.propertyType} in ${p.locality}`,

      // Text
      comment: p.comment || null,
      description: p.description || null,

      // Meta
      categoryId: p.category_id_id || null,
      userId: p.user_id_id || null,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at
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





module.exports = router;