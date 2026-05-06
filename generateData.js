import { db } from './server.js';  // import your existing pool

const cities = [
  { city: 'Delhi', areas: ['Karol Bagh', 'Saket', 'Connaught Place', 'Dwarka', 'Rohini'] },
  { city: 'Mumbai', areas: ['Goregaon', 'Powai', 'Juhu', 'Andheri', 'Bandra'] },
  { city: 'Bangalore', areas: ['Whitefield', 'Electronic City', 'Bellandur', 'Marathahalli', 'Koramangala'] },
  { city: 'Hyderabad', areas: ['Kondapur', 'Jubilee Hills', 'Nallagandla', 'Gachibowli', 'Madhapur'] },
  { city: 'Chennai', areas: ['Tambaram', 'Besant Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
  { city: 'Pune', areas: ['Balewadi', 'Magarpatta', 'Kharadi', 'Hinjewadi', 'Wakad'] },
  { city: 'Jaipur', areas: ['C Scheme', 'Mansarovar', 'Tonk Road', 'Amber', 'Kukas'] },
  { city: 'Kolkata', areas: ['Alipore', 'Behala', 'Salt Lake', 'Newtown', 'Ballygunge'] },
  { city: 'Ahmedabad', areas: ['Bopal', 'SG Highway', 'Chandkheda', 'Navrangpura', 'Satellite'] },
  { city: 'Kochi', areas: ['Fort Kochi', 'Marine Drive', 'Edapally', 'Kakkanad', 'Aluva'] },
];

const propertyTypes = ['villa', 'apartment', 'plot', 'commercial'];
const dealTypes = ['sell', 'rent', 'lease']; // Added deal types

const facings = [
  'North', 'South', 'East', 'West',
  'North-East', 'North-West', 'South-East', 'South-West'
];

const postedBy = ['Agent', 'Developer', 'Builder', 'Owner'];

const descriptions = {
  villa: [
    'Exclusive villa with 24/7 security',
    'Luxurious villa with private garden',
    'Independent villa with ample parking'
  ],
  apartment: [
    'Premium apartment with clubhouse access',
    'Ready to move apartment with modern amenities',
    'Spacious apartment with beautiful city views'
  ],
  plot: [
    'Approved plot with no legal issues',
    'Corner plot with all utilities and clear title',
    'Premium plot in a gated community layout'
  ],
  commercial: [
    'Prime commercial space with high footfall',
    'Premium office space in IT corridor',
    'Commercial property suitable for multiple businesses'
  ],
};

// Image URLs for different property types (1 image per property is enough)
const imageUrls = {
  villa: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
  ],
  apartment: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
  ],
  plot: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
  ],
  commercial: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
  ]
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function generateRow(id, dealType) {
  const cityData = cities[randomInt(0, cities.length - 1)];
  const area = cityData.areas[randomInt(0, cityData.areas.length - 1)];
  const propertyType = propertyTypes[randomInt(0, propertyTypes.length - 1)];
  const facing = facings[randomInt(0, facings.length - 1)];
  const poster = postedBy[randomInt(0, postedBy.length - 1)];
  const desc = descriptions[propertyType][randomInt(0, descriptions[propertyType].length - 1)];

  const isPlotOrCommercial = propertyType === 'plot' || propertyType === 'commercial';

  const bedrooms = isPlotOrCommercial ? 0 : randomInt(1, 6);
  const bathrooms = isPlotOrCommercial ? 0 : randomInt(1, 5);
  const floor = (propertyType === 'apartment') ? randomInt(1, 25) : null;

  const builtupArea = randomInt(500, 6000);
  const userId = randomInt(1, 10);

  let minBudget, maxBudget, price;

  // Price logic based on deal type
  if (dealType === 'sell') {
    // Sell: Higher prices (in lakhs/crores)
    if (propertyType === 'villa') {
      minBudget = randomInt(5000000, 50000000);
    } else if (propertyType === 'apartment') {
      minBudget = randomInt(1000000, 20000000);
    } else if (propertyType === 'plot') {
      minBudget = randomInt(500000, 10000000);
    } else {
      minBudget = randomInt(2000000, 30000000);
    }
    maxBudget = minBudget + randomInt(100000, 10000000);
    price = randomInt(minBudget, maxBudget);
  } else if (dealType === 'rent') {
    // Rent: Monthly rent prices (in thousands)
    if (propertyType === 'villa') {
      minBudget = randomInt(50000, 200000);
    } else if (propertyType === 'apartment') {
      minBudget = randomInt(15000, 80000);
    } else if (propertyType === 'plot') {
      minBudget = randomInt(10000, 50000);
    } else {
      minBudget = randomInt(30000, 150000);
    }
    maxBudget = minBudget + randomInt(5000, 50000);
    price = randomInt(minBudget, maxBudget);
  } else { // lease
    // Lease: Annual lease prices (in lakhs)
    if (propertyType === 'villa') {
      minBudget = randomInt(300000, 1500000);
    } else if (propertyType === 'apartment') {
      minBudget = randomInt(100000, 500000);
    } else if (propertyType === 'plot') {
      minBudget = randomInt(50000, 300000);
    } else {
      minBudget = randomInt(200000, 1000000);
    }
    maxBudget = minBudget + randomInt(50000, 200000);
    price = randomInt(minBudget, maxBudget);
  }

  const coords = {
    Delhi:     [28.6 + Math.random() * 0.2,  77.0 + Math.random() * 0.2],
    Mumbai:    [19.0 + Math.random() * 0.15, 72.8 + Math.random() * 0.15],
    Bangalore: [12.9 + Math.random() * 0.15, 77.5 + Math.random() * 0.2],
    Hyderabad: [17.3 + Math.random() * 0.2,  78.4 + Math.random() * 0.2],
    Chennai:   [13.0 + Math.random() * 0.15, 80.2 + Math.random() * 0.15],
    Pune:      [18.5 + Math.random() * 0.1,  73.8 + Math.random() * 0.15],
    Jaipur:    [26.8 + Math.random() * 0.2,  75.7 + Math.random() * 0.2],
    Kolkata:   [22.5 + Math.random() * 0.15, 88.3 + Math.random() * 0.15],
    Ahmedabad: [23.0 + Math.random() * 0.1,  72.5 + Math.random() * 0.15],
    Kochi:     [9.9  + Math.random() * 0.1,  76.2 + Math.random() * 0.15],
  };

  const [lat, lng] = coords[cityData.city];
  const createdAt = randomDate(new Date('2025-01-01'), new Date('2026-04-30'));

  return [
    id,
    `${area} ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} ${id}`,
    propertyType,
    dealType, // Add type column
    price,
    minBudget,
    maxBudget,
    lat,
    lng,
    cityData.city,
    area,
    builtupArea,
    null,
    bedrooms,
    bathrooms,
    floor,
    facing,
    desc,
    1,
    'Approved',
    userId,
    poster,
    createdAt,
    createdAt
  ];
}

// Generate a single image for a property
function generatePropertyImage(propertyId, propertyType) {
  const typeImages = imageUrls[propertyType] || imageUrls.apartment;
  const imageUrl = typeImages[0]; // Just take the first image (1 image per property)
  const uniqueImageUrl = `${imageUrl}&prop=${propertyId}`;
  
  return [propertyId, uniqueImageUrl];
}

async function generateData() {
  const TOTAL_SELL = 40000;
  const TOTAL_RENT = 30000;
  const TOTAL_LEASE = 30000;
  const TOTAL = TOTAL_SELL + TOTAL_RENT + TOTAL_LEASE;
  const BATCH_SIZE = 1000;

  const propertyColumns = `(property_id, property_name, property_type, type, price, min_budget, max_budget, 
    lat, \`long\`, location, nearby, buildup_area, site_area, 
    bedrooms_count, bathrooms_count, floor, facing, description, 
    status, Admin_status, user_id_id, posted_by, created_at, updated_at)`;

  const imageColumns = `(property_id, image)`;

  console.log(`📊 Starting data generation:`);
  console.log(`   Sell: ${TOTAL_SELL} properties`);
  console.log(`   Rent: ${TOTAL_RENT} properties`);
  console.log(`   Lease: ${TOTAL_LEASE} properties`);
  console.log(`   Total: ${TOTAL} properties`);
  console.log(`   Each property will have 1 image\n`);

  let propertyId = 1;
  
  // Helper function to insert batch
  async function insertBatch(properties, images, startId, endId) {
    // Insert properties
    const propertyPlaceholders = properties.map(() => `(${Array(24).fill('?').join(', ')})`).join(', ');
    const propertyValues = properties.flat();

    await db.query(
      `INSERT INTO app_property ${propertyColumns} VALUES ${propertyPlaceholders}`,
      propertyValues
    );

    // Insert images
    if (images.length > 0) {
      const imagePlaceholders = images.map(() => `(?, ?)`).join(', ');
      const imageValues = images.flat();

      await db.query(
        `INSERT INTO app_property_images ${imageColumns} VALUES ${imagePlaceholders}`,
        imageValues
      );
    }

    console.log(`✅ Inserted properties ${startId} - ${endId} (${properties.length} properties, ${images.length} images)`);
  }

  // Generate SELL properties (40,000)
  console.log('\n🚀 Generating SELL properties...');
  for (let i = 0; i < TOTAL_SELL; i += BATCH_SIZE) {
    const batchProperties = [];
    const batchImages = [];
    const batchStart = propertyId;
    
    for (let j = 0; j < BATCH_SIZE && propertyId <= TOTAL_SELL; j++) {
      const propertyRow = generateRow(propertyId, 'sell');
      batchProperties.push(propertyRow);
      
      // Generate 1 image for this property
      const propertyType = propertyRow[2];
      const propertyImage = generatePropertyImage(propertyId, propertyType);
      batchImages.push(propertyImage);
      
      propertyId++;
    }
    
    await insertBatch(batchProperties, batchImages, batchStart, propertyId - 1);
  }

  // Generate RENT properties (30,000)
  console.log('\n🚀 Generating RENT properties...');
  const rentStartId = propertyId;
  for (let i = 0; i < TOTAL_RENT; i += BATCH_SIZE) {
    const batchProperties = [];
    const batchImages = [];
    const batchStart = propertyId;
    
    for (let j = 0; j < BATCH_SIZE && propertyId <= rentStartId + TOTAL_RENT; j++) {
      const propertyRow = generateRow(propertyId, 'rent');
      batchProperties.push(propertyRow);
      
      // Generate 1 image for this property
      const propertyType = propertyRow[2];
      const propertyImage = generatePropertyImage(propertyId, propertyType);
      batchImages.push(propertyImage);
      
      propertyId++;
    }
    
    await insertBatch(batchProperties, batchImages, batchStart, propertyId - 1);
  }

  // Generate LEASE properties (30,000)
  console.log('\n🚀 Generating LEASE properties...');
  const leaseStartId = propertyId;
  for (let i = 0; i < TOTAL_LEASE; i += BATCH_SIZE) {
    const batchProperties = [];
    const batchImages = [];
    const batchStart = propertyId;
    
    for (let j = 0; j < BATCH_SIZE && propertyId <= leaseStartId + TOTAL_LEASE; j++) {
      const propertyRow = generateRow(propertyId, 'lease');
      batchProperties.push(propertyRow);
      
      // Generate 1 image for this property
      const propertyType = propertyRow[2];
      const propertyImage = generatePropertyImage(propertyId, propertyType);
      batchImages.push(propertyImage);
      
      propertyId++;
    }
    
    await insertBatch(batchProperties, batchImages, batchStart, propertyId - 1);
  }

  console.log('\n✅ Done! All properties and their images inserted.');
  
  // Verify counts
  const propertyCount = await db.query('SELECT COUNT(*) as count FROM app_property');
  const imageCount = await db.query('SELECT COUNT(*) as count FROM app_property_images');
  const dealTypeCounts = await db.query(
    'SELECT type, COUNT(*) as count FROM app_property GROUP BY type'
  );
  
  console.log(`\n📊 Final Database Counts:`);
  console.log(`   Total Properties: ${propertyCount[0].count}`);
  console.log(`   Total Images: ${imageCount[0].count}`);
  console.log(`\n📊 Deal Type Breakdown:`);
  dealTypeCounts.forEach(row => {
    console.log(`   ${row.type}: ${row.count} properties`);
  });
  
  process.exit(0);
}

generateData().catch(console.error);