const express = require("express");
const { db } = require('./server.js');

const router = express.Router();   // ✅ FIRST create router
module.exports = router;


router.get('/:id/images', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    console.log(`Fetching images for property ID: ${propertyId}`); // Debug log
    
    // Check if property exists
    const [propertyExists] = await db.query(
      'SELECT property_id FROM app_property WHERE property_id = ?',
      [propertyId]
    );
    
    if (propertyExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      }); 
    }
    
    const [images] = await db.query(
      'SELECT id, image FROM app_property_images WHERE property_id = ? ORDER BY id',
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
      `SELECT property_id, image FROM app_property_images 
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


// GET: Properties for map with filtering
router.get('/map', async (req, res) => {
  const {
    south, north, west, east,
    type,                // sell / rent / lease
    propertyType,        // villa / plot / apartment
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
        bedrooms_count as bhk,
        created_at,
        CASE 
          WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 'new_launch'
          ELSE 'ready'
        END as status
      FROM app_property 
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

    // ✅ Bounds filter
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

    // ✅ Price filter
    if (priceMin !== undefined && priceMax !== undefined) {
      query += ` AND COALESCE(price, min_budget) BETWEEN ? AND ?`;
      params.push(parseFloat(priceMin), parseFloat(priceMax));
    }

    // ✅ Property Type filter (villa / plot / apartment)
    if (propertyType) {
      const arr = propertyType.split(',');
      const placeholders = arr.map(() => '?').join(',');
      query += ` AND property_type IN (${placeholders})`;
      params.push(...arr);
    }

    // ✅ Listing Type filter (sell / rent / lease)
    if (type) {
      const arr = type.split(',');
      const placeholders = arr.map(() => '?').join(',');
      query += ` AND type IN (${placeholders})`;
      params.push(...arr);
    }

    // ✅ Zoom-based limit
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

    // 🔥 Execute query
    const [properties] = await db.execute(query, params);

    // ✅ Transform response
    const transformed = properties.map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),

      // UI fields
      propertyType: p.propertyType || 'apartment',
      listingType: p.listingType || 'sell',

      price: p.price || 0,
      area: p.area || 1000,
      city: p.city || 'India',
      locality: p.locality || p.city || 'Location',
      title: p.title || `${p.propertyType} in ${p.locality}`,
      bhk: p.bhk || 2,
      status: p.status,
      created_at: p.created_at
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

// GET: Property details for modal
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [properties] = await db.execute(`
      SELECT 
        p.*,
        u.username,
        u.email,
        GROUP_CONCAT(pi.image) as image_urls
      FROM app_property p
      LEFT JOIN users_user u ON p.user_id_id = u.id
      LEFT JOIN app_property_images pi ON p.property_id = pi.property_id
      WHERE p.property_id = ? AND p.status = 1
      GROUP BY p.property_id
    `, [id]);

    if (properties.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Property not found' 
      });
    }

    const property = properties[0];
    
    // Parse images
    property.images = property.image_urls ? property.image_urls.split(',') : [];
    delete property.image_urls;
    
    // Parse coordinates
    property.latitude = parseFloat(property.lat);
    property.longitude = parseFloat(property.long);
    
    // Format data for frontend
    const formattedProperty = {
      id: property.property_id,
      title: property.property_name || `${property.property_type} in ${property.location}`,
      locality: property.nearby || property.location?.split(',')[0] || 'Location',
      city: property.location?.split(',')[0] || 'City',
      type: property.property_type || 'apartment',
      price: property.price || property.min_budget || 0,
      area: property.buildup_area || property.site_area || 1000,
      bhk: property.bedrooms_count || 2,
      bathrooms: property.bathrooms_count || 2,
      floor: property.floor || 0,
      facing: property.facing || 'East',
      description: property.description || 'Beautiful property in prime location',
      images: property.images,
      status: property.status,
      created_at: property.created_at,
      posted_by: property.posted_by || 'Owner',
      location: property.location,
      latitude: property.latitude,
      longitude: property.longitude
    };

    // Add new launch badge for properties less than 7 days old
    const daysOld = Math.floor((Date.now() - new Date(property.created_at)) / (1000 * 60 * 60 * 24));
    formattedProperty.isNew = daysOld <= 7;

    res.json({
      success: true,
      property: formattedProperty
    });

  } catch (error) {
    console.error('Property detail error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET: Filter options
router.get('/options/filters', async (req, res) => {
  try {
    // Get unique property types
    const [categories] = await db.execute(`
      SELECT DISTINCT property_type as value, property_type as label
      FROM app_property 
      WHERE property_type IS NOT NULL 
        AND property_type != '' 
        AND status = 1
        AND Admin_status = 'Approved'
      LIMIT 20
    `);

    // Get price range
    const [priceRange] = await db.execute(`
      SELECT 
        MIN(COALESCE(price, min_budget, 0)) as min_price,
        MAX(COALESCE(price, max_budget, 1000000000)) as max_price
      FROM app_property 
      WHERE status = 1 
        AND Admin_status = 'Approved'
    `);

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM app_property 
      WHERE status = 1 
        AND Admin_status = 'Approved'
    `);

    res.json({
      success: true,
      categories: categories.length ? categories : [
        { value: 'apartment', label: 'Apartment' },
        { value: 'villa', label: 'Villa' },
        { value: 'plot', label: 'Plot' },
        { value: 'commercial', label: 'Commercial' }
      ],
      priceRange: {
        min: priceRange[0]?.min_price || 0,
        max: priceRange[0]?.max_price || 1000000000
      },
      totalProperties: countResult[0]?.total || 0
    });

  } catch (error) {
    console.error('Filter options error:', error);
    // Return default options on error
    res.json({
      success: true,
      categories: [
        { value: 'apartment', label: 'Apartment' },
        { value: 'villa', label: 'Villa' },
        { value: 'plot', label: 'Plot' },
        { value: 'commercial', label: 'Commercial' }
      ],
      priceRange: { min: 0, max: 1000000000 },
      totalProperties: 0
    });
  }
});






module.exports = router;