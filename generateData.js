// const { db } = require('./server.js');

// const cities = [
//   { city: 'Delhi', areas: ['Karol Bagh', 'Saket', 'Connaught Place', 'Dwarka', 'Rohini'] },
//   { city: 'Mumbai', areas: ['Goregaon', 'Powai', 'Juhu', 'Andheri', 'Bandra'] },
//   { city: 'Bangalore', areas: ['Whitefield', 'Electronic City', 'Bellandur', 'Marathahalli', 'Koramangala'] },
//   { city: 'Hyderabad', areas: ['Kondapur', 'Jubilee Hills', 'Nallagandla', 'Gachibowli', 'Madhapur'] },
//   { city: 'Chennai', areas: ['Tambaram', 'Besant Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
//   { city: 'Pune', areas: ['Balewadi', 'Magarpatta', 'Kharadi', 'Hinjewadi', 'Wakad'] },
//   { city: 'Jaipur', areas: ['C Scheme', 'Mansarovar', 'Tonk Road', 'Amber', 'Kukas'] },
//   { city: 'Kolkata', areas: ['Alipore', 'Behala', 'Salt Lake', 'Newtown', 'Ballygunge'] },
//   { city: 'Ahmedabad', areas: ['Bopal', 'SG Highway', 'Chandkheda', 'Navrangpura', 'Satellite'] },
//   { city: 'Kochi', areas: ['Fort Kochi', 'Marine Drive', 'Edapally', 'Kakkanad', 'Aluva'] },
// ];

// const typeOptions = ['jvjd', 'built to suit'];
// const propertyTypeOptions = ['plot', 'land'];

// const facings = [
//   'North', 'South', 'East', 'West',
//   'North-East', 'North-West', 'South-East', 'South-West'
// ];

// const postedBy = ['Agent', 'Developer', 'Builder', 'Owner'];
// const powerBackupOptions = ['Full', 'Partial', 'No'];
// const yesNoOptions = ['Yes', 'No'];
// const unitsOptions = ['Sq.ft', 'Sq.yards', 'Acres', 'Sq.meters'];

// function randomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomFloat(min, max, decimals = 2) {
//   const value = min + Math.random() * (max - min);
//   return parseFloat(value.toFixed(decimals));
// }

// function randomDate(start, end) {
//   const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
//   return d.toISOString().slice(0, 19).replace('T', ' ');
// }

// function generatePhoneNumber() {
//   return `+91${randomInt(7000000000, 9999999999)}`;
// }

// function generateRow(id) {
//   const cityData = cities[randomInt(0, cities.length - 1)];
//   const area = cityData.areas[randomInt(0, cityData.areas.length - 1)];
//   const propertyType = propertyTypeOptions[randomInt(0, propertyTypeOptions.length - 1)];
//   const typeProperty = typeOptions[randomInt(0, typeOptions.length - 1)];
//   const facing = facings[randomInt(0, facings.length - 1)];
//   const poster = postedBy[randomInt(0, postedBy.length - 1)];
//   const powerBackup = powerBackupOptions[randomInt(0, powerBackupOptions.length - 1)];
//   const yesNo = yesNoOptions[randomInt(0, yesNoOptions.length - 1)];
//   const units = unitsOptions[randomInt(0, unitsOptions.length - 1)];

//   const isPlotOrLand = propertyType === 'plot' || propertyType === 'land';
//   const isCommercial = propertyType.includes('commercial');

//   const bedrooms = isPlotOrLand ? 0 : randomInt(1, 6);
//   const bathrooms = isPlotOrLand ? 0 : randomInt(1, 5);
//   const floor = randomInt(0, 5);

//   const builtupArea = isPlotOrLand ? 0 : randomInt(500, 6000);
//   const siteArea = randomInt(500, 10000);
//   const length = randomFloat(50, 200, 2);
//   const width = randomFloat(50, 200, 2);
//   const roadwidth = randomFloat(20, 100, 2);
  
//   const min_acres = randomFloat(0.5, 5, 2);
//   const max_acres = min_acres + randomFloat(0.5, 10, 2);
//   const ratio = `${randomInt(1, 10)}:${randomInt(1, 10)}`;

//   let minBudget, maxBudget, price;

//   // Price logic
//   if (propertyType === 'plot') {
//     minBudget = randomInt(500000, 10000000);
//   } else if (propertyType === 'land') {
//     minBudget = randomInt(1000000, 50000000);
//   } else {
//     minBudget = randomInt(2000000, 30000000);
//   }
//   maxBudget = minBudget + randomInt(100000, 10000000);
//   price = randomInt(minBudget, maxBudget);

//   const coords = {
//     Delhi:     [28.6 + Math.random() * 0.2,  77.0 + Math.random() * 0.2],
//     Mumbai:    [19.0 + Math.random() * 0.15, 72.8 + Math.random() * 0.15],
//     Bangalore: [12.9 + Math.random() * 0.15, 77.5 + Math.random() * 0.2],
//     Hyderabad: [17.3 + Math.random() * 0.2,  78.4 + Math.random() * 0.2],
//     Chennai:   [13.0 + Math.random() * 0.15, 80.2 + Math.random() * 0.15],
//     Pune:      [18.5 + Math.random() * 0.1,  73.8 + Math.random() * 0.15],
//     Jaipur:    [26.8 + Math.random() * 0.2,  75.7 + Math.random() * 0.2],
//     Kolkata:   [22.5 + Math.random() * 0.15, 88.3 + Math.random() * 0.15],
//     Ahmedabad: [23.0 + Math.random() * 0.1,  72.5 + Math.random() * 0.15],
//     Kochi:     [9.9  + Math.random() * 0.1,  76.2 + Math.random() * 0.15],
//   };

//   const [lat, lng] = coords[cityData.city];
//   const createdAt = randomDate(new Date('2025-01-01'), new Date('2026-04-30'));
//   const boostDate = randomDate(new Date('2026-01-01'), new Date('2026-06-30'));
  
//   const description = `Beautiful ${propertyType} located in ${area}, ${cityData.city}. Prime location with great connectivity.`;
//   const comment = `Great investment opportunity in ${area}`;

//   return [
//     id,                                           // 1. property_id
//     `${area} ${propertyType} ${id}`,              // 2. property_name
//     propertyType,                                 // 3. property_type
//     price,                                        // 4. price
//     minBudget,                                    // 5. min_budget
//     maxBudget,                                    // 6. max_budget
//     lat,                                          // 7. lat
//     lng,                                          // 8. long
//     `${area}, ${cityData.city}`,                  // 9. location
//     `${area}, ${cityData.city}`,                  // 10. nearby
//     builtupArea,                                  // 11. buildup_area
//     siteArea,                                     // 12. site_area
//     bedrooms,                                     // 13. bedrooms_count
//     bathrooms,                                    // 14. bathrooms_count
//     floor,                                        // 15. floor
//     facing,                                       // 16. facing
//     description,                                  // 17. description
//     1,                                            // 18. status
//     'Approved',                                   // 19. Admin_status
//     randomInt(1, 100),                            // 20. user_id_id
//     poster,                                       // 21. posted_by
//     createdAt,                                    // 22. created_at
//     createdAt,                                    // 23. updated_at
//     typeProperty,                                 // 24. type (jvjd or built to suit)
//     null,                                         // 25. type_property
//     generatePhoneNumber(),                        // 26. mobile_no
//     null,                                         // 27. admin_mobile
//     min_acres,                                    // 28. min_acres
//     max_acres,                                    // 29. max_acres
//     ratio,                                        // 30. ratio
//     comment,                                      // 31. comment
//     roadwidth,                                    // 32. roadwidth
//     length,                                       // 33. length
//     width,                                        // 34. width
//     units,                                        // 35. units
//     randomInt(1, 10),                             // 36. no_of_flores
//     randomInt(0, 5),                              // 37. _1bhk_count
//     randomInt(0, 5),                              // 38. _2bhk_count
//     randomInt(0, 5),                              // 39. _3bhk_count
//     randomInt(0, 5),                              // 40. _4bhk_count
//     randomInt(1, 20),                             // 41. rooms_count
//     randomInt(0, 3),                              // 42. duplex_bedrooms
//     isCommercial ? randomInt(1, 10) : 0,          // 43. shop_count
//     propertyType === 'villa' ? randomInt(1, 5) : 0, // 44. house_count
//     randomInt(1, 5).toString(),                   // 45. balcony
//     powerBackup,                                  // 46. power_backup
//     yesNo,                                        // 47. gated_security
//     yesNo,                                        // 48. borewell
//     yesNo,                                        // 49. parking
//     randomInt(0, 1) ? 'Yes' : 'No',              // 50. lift
//     randomFloat(10000, 500000, 2),               // 51. advance_payment
//     boostDate,                                    // 52. boost_date
//     randomInt(1, 20)                              // 53. category_id_id
//   ];
// }

// async function generateData() {
//   const TOTAL_RECORDS = 10;  // 10 rows only
//   const BATCH_SIZE = 10;

//   const propertyColumns = `(property_id, property_name, property_type, price, min_budget, max_budget, 
//     lat, \`long\`, location, nearby, buildup_area, site_area, 
//     bedrooms_count, bathrooms_count, floor, facing, description, 
//     status, Admin_status, user_id_id, posted_by, created_at, updated_at, 
//     type, type_property, mobile_no, admin_mobile, min_acres, max_acres, 
//     ratio, comment, roadwidth, length, width, units, no_of_flores, 
//     _1bhk_count, _2bhk_count, _3bhk_count, _4bhk_count, rooms_count, 
//     duplex_bedrooms, shop_count, house_count, balcony, power_backup, 
//     gated_security, borewell, parking, lift, advance_payment, boost_date, category_id_id)`;

//   console.log(`📊 Starting data generation:`);
//   console.log(`   Total Properties: ${TOTAL_RECORDS}`);
//   console.log(`   Type: jvjd or built to suit`);
//   console.log(`   Property Type: plot or land`);
//   console.log(`   No images will be generated\n`);

//   let propertyId = 1;
//   const startTime = Date.now();
  
//   async function insertBatch(properties, startId, endId) {
//     const placeholders = properties.map(() => `(${Array(53).fill('?').join(', ')})`).join(', ');
//     const values = properties.flat();

//     await db.query(
//       `INSERT INTO property_property ${propertyColumns} VALUES ${placeholders}`,
//       values
//     );

//     const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
//     console.log(`✅ Properties ${startId} - ${endId} | ${properties.length} props | ${elapsed}s`);
//   }

//   // Generate properties
//   console.log('🚀 Generating properties...');
  
//   const batchProperties = [];
//   const batchStart = propertyId;
  
//   for (let j = 0; j < TOTAL_RECORDS; j++) {
//     const propertyRow = generateRow(propertyId);
//     batchProperties.push(propertyRow);
//     console.log(`   Generated property ${propertyId}: type=${propertyRow[23]} | property_type=${propertyRow[2]}`);
//     propertyId++;
//   }
//   await insertBatch(batchProperties, batchStart, propertyId - 1);

//   const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
//   console.log(`\n✅ COMPLETE! ${TOTAL_RECORDS} properties inserted in ${totalTime} seconds`);
  
//   // Verify counts
//   const [propertyCount] = await db.query('SELECT COUNT(*) as count FROM property_property');
//   const [typeCount] = await db.query('SELECT type, COUNT(*) as count FROM property_property GROUP BY type');
//   const [propertyTypeCount] = await db.query('SELECT property_type, COUNT(*) as count FROM property_property GROUP BY property_type');
  
//   console.log(`\n📊 FINAL DATABASE COUNTS:`);
//   console.log(`   Total Properties: ${propertyCount.count}`);
//   console.log(`\n📊 Type Breakdown (jvjd/built to suit):`);
//   typeCount.forEach(row => {
//     console.log(`   ${row.type}: ${row.count} properties`);
//   });
//   console.log(`\n📊 Property Type Breakdown (plot/land):`);
//   propertyTypeCount.forEach(row => {
//     console.log(`   ${row.property_type}: ${row.count} properties`);
//   });
  
//   process.exit(0);
// }

// generateData().catch(console.error);






// bestdetail data

// const { db } = require('./server.js');

// const rentalTypes = ['PLOT', 'LAND', 'VILLA', 'APARTMENT'];

// const cities = [
//   { city: 'Delhi', lat: 28.6139, lng: 77.2090, areas: ['Karol Bagh', 'Saket', 'Dwarka', 'Rohini', 'Connaught Place'] },
//   { city: 'Mumbai', lat: 19.0760, lng: 72.8777, areas: ['Goregaon', 'Powai', 'Juhu', 'Andheri', 'Bandra'] },
//   { city: 'Bangalore', lat: 12.9716, lng: 77.5946, areas: ['Whitefield', 'Electronic City', 'Bellandur', 'Marathahalli', 'Koramangala'] },
//   { city: 'Hyderabad', lat: 17.3850, lng: 78.4867, areas: ['Kondapur', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Nallagandla'] },
//   { city: 'Chennai', lat: 13.0827, lng: 80.2707, areas: ['Tambaram', 'Besant Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
//   { city: 'Pune', lat: 18.5204, lng: 73.8567, areas: ['Balewadi', 'Magarpatta', 'Kharadi', 'Hinjewadi', 'Wakad'] },
//   { city: 'Jaipur', lat: 26.9124, lng: 75.7873, areas: ['C Scheme', 'Mansarovar', 'Tonk Road', 'Amber', 'Kukas'] },
//   { city: 'Kolkata', lat: 22.5726, lng: 88.3639, areas: ['Alipore', 'Behala', 'Salt Lake', 'Newtown', 'Ballygunge'] },
//   { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714, areas: ['Bopal', 'SG Highway', 'Chandkheda', 'Navrangpura', 'Satellite'] },
//   { city: 'Lucknow', lat: 26.8467, lng: 80.9462, areas: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Jankipuram'] }
// ];

// const adminStatuses = ['Pending', 'Approved', 'Rejected', 'Under Review'];

// function randomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomDate(start, end) {
//   const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
//   return date.toISOString().slice(0, 19).replace('T', ' ');
// }

// function generateRow(dealId) {
//   const cityData = cities[randomInt(0, cities.length - 1)];
//   const area = cityData.areas[randomInt(0, cityData.areas.length - 1)];
//   const propertyType = rentalTypes[randomInt(0, rentalTypes.length - 1)];
//   const adminStatus = adminStatuses[randomInt(0, adminStatuses.length - 1)];
  
//   // Random location within city bounds (±0.2 degrees)
//   const lat = cityData.lat + (Math.random() - 0.5) * 0.2;
//   const lng = cityData.lng + (Math.random() - 0.5) * 0.2;
  
//   // Budget based on property type
//   let budget;
//   if (propertyType === 'VILLA') {
//     budget = randomInt(5000000, 50000000);
//   } else if (propertyType === 'APARTMENT') {
//     budget = randomInt(3000000, 20000000);
//   } else if (propertyType === 'PLOT') {
//     budget = randomInt(1000000, 30000000);
//   } else { // LAND
//     budget = randomInt(500000, 20000000);
//   }
  
//   const location_detail = `${area}, ${cityData.city} - ${randomInt(100000, 999999)}`;
  
//   const descriptions = [
//     `Excellent ${propertyType} located in ${area}, ${cityData.city}. Prime location with great connectivity.`,
//     `Best deal for ${propertyType} in ${area}. Near metro station and market.`,
//     `${propertyType} available at competitive price in ${area}. Clear title and ready to move.`,
//     `Premium ${propertyType} in ${area}. Great investment opportunity with high ROI.`,
//     `Spacious ${propertyType} with all modern amenities. Located in peaceful ${area}.`
//   ];
  
//   const description = descriptions[randomInt(0, descriptions.length - 1)];
//   const created_at = randomDate(new Date('2025-01-01'), new Date('2026-04-30'));
//   const updated_at = created_at;
  
//   return [
//     dealId,
//     propertyType,
//     budget,
//     location_detail,
//     lat,
//     lng,
//     description,
//     adminStatus,
//     created_at,
//     updated_at,
//     randomInt(1, 1000)  // user_id_id
//   ];
// }

// async function insertWithRetry(query, values, retries = 3) {
//   for (let i = 0; i < retries; i++) {
//     try {
//       await db.query(query, values);
//       return true;
//     } catch (error) {
//       console.log(`   Retry ${i + 1}/${retries} after error: ${error.message}`);
//       if (i === retries - 1) throw error;
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     }
//   }
//   return false;
// }

// async function generateData() {
//   const TOTAL_RECORDS = 100000;
//   const BATCH_SIZE = 100;
  
//   console.log(`📊 Starting data generation for best_deals table`);
//   console.log(`   Total Records: ${TOTAL_RECORDS.toLocaleString()} deals`);
//   console.log(`   Batch Size: ${BATCH_SIZE} records`);
//   console.log(`   Property Types: ${rentalTypes.join(', ')}`);
//   console.log(`   Total Batches: ${Math.ceil(TOTAL_RECORDS / BATCH_SIZE)}\n`);
  
//   try {
//     await db.query('SELECT 1');
//     console.log('✅ Database connection successful\n');
//   } catch (error) {
//     console.error('❌ Database connection failed:', error.message);
//     process.exit(1);
//   }
  
//   let insertedCount = 0;
//   const startTime = Date.now();
  
//   for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
//     const batch = [];
//     const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECORDS - i);
    
//     for (let j = 0; j < currentBatchSize; j++) {
//       const dealId = insertedCount + j + 1;
//       batch.push(generateRow(dealId));
//     }
    
//     const placeholders = batch.map(() => `(${Array(11).fill('?').join(', ')})`).join(', ');
//     const values = batch.flat();
//     const query = `INSERT INTO best_deals 
//       (deal_id, property_type, budget, location, lat, \`long\`, description, 
//        Admin_status, created_at, updated_at, user_id_id) 
//       VALUES ${placeholders}`;
    
//     try {
//       await insertWithRetry(query, values);
//       insertedCount += currentBatchSize;
//       const percentage = Math.floor(insertedCount / TOTAL_RECORDS * 100);
//       const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
//       console.log(`✅ ${insertedCount.toLocaleString()} / ${TOTAL_RECORDS.toLocaleString()} (${percentage}%) - Elapsed: ${elapsed}s`);
      
//       await new Promise(resolve => setTimeout(resolve, 50));
      
//     } catch (error) {
//       console.error(`❌ Error at ${insertedCount}:`, error.message);
//       process.exit(1);
//     }
//   }
  
//   const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
//   console.log(`\n✅ Complete! ${TOTAL_RECORDS.toLocaleString()} records inserted in ${totalTime} seconds`);
  
//   try {
//     const [result] = await db.query('SELECT COUNT(*) as count FROM best_deals');
//     console.log(`\n📊 Final Database Count: ${result.count.toLocaleString()} records`);
    
//     const [typeBreakdown] = await db.query(
//       'SELECT property_type, COUNT(*) as count FROM best_deals GROUP BY property_type'
//     );
    
//     console.log(`\n📊 Property Type Breakdown:`);
//     typeBreakdown.forEach(row => {
//       const percentage = Math.floor(row.count / TOTAL_RECORDS * 100);
//       console.log(`   ${row.property_type}: ${row.count.toLocaleString()} (${percentage}%)`);
//     });
    
//     const [statusBreakdown] = await db.query(
//       'SELECT Admin_status, COUNT(*) as count FROM best_deals GROUP BY Admin_status'
//     );
    
//     console.log(`\n📊 Status Breakdown:`);
//     statusBreakdown.forEach(row => {
//       const percentage = Math.floor(row.count / TOTAL_RECORDS * 100);
//       console.log(`   ${row.Admin_status}: ${row.count.toLocaleString()} (${percentage}%)`);
//     });
    
//   } catch (error) {
//     console.error('Error getting statistics:', error.message);
//   }
  
//   process.exit(0);
// }

// process.on('SIGINT', () => {
//   console.log('\n\n⚠️ Process interrupted by user');
//   process.exit(0);
// });

// generateData().catch(error => {
//   console.error('Fatal error:', error.message);
//   process.exit(1);
// });


// const { db } = require('./server.js');

// const cities = [
//   { city: 'Delhi', areas: ['Karol Bagh', 'Saket', 'Connaught Place', 'Dwarka', 'Rohini'] },
//   { city: 'Mumbai', areas: ['Goregaon', 'Powai', 'Juhu', 'Andheri', 'Bandra'] },
//   { city: 'Bangalore', areas: ['Whitefield', 'Electronic City', 'Bellandur', 'Marathahalli', 'Koramangala'] },
//   { city: 'Hyderabad', areas: ['Kondapur', 'Jubilee Hills', 'Nallagandla', 'Gachibowli', 'Madhapur'] },
//   { city: 'Chennai', areas: ['Tambaram', 'Besant Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
//   { city: 'Pune', areas: ['Balewadi', 'Magarpatta', 'Kharadi', 'Hinjewadi', 'Wakad'] },
//   { city: 'Jaipur', areas: ['C Scheme', 'Mansarovar', 'Tonk Road', 'Amber', 'Kukas'] },
//   { city: 'Kolkata', areas: ['Alipore', 'Behala', 'Salt Lake', 'Newtown', 'Ballygunge'] },
//   { city: 'Ahmedabad', areas: ['Bopal', 'SG Highway', 'Chandkheda', 'Navrangpura', 'Satellite'] },
//   { city: 'Kochi', areas: ['Fort Kochi', 'Marine Drive', 'Edapally', 'Kakkanad', 'Aluva'] },
// ];

// const typeOptions = ['sell']; // FORCED to 'sell' only
// const propertyTypeOptions = ['plot', 'land'];

// const facings = [
//   'North', 'South', 'East', 'West',
//   'North-East', 'North-West', 'South-East', 'South-West'
// ];

// const postedBy = ['Agent', 'Developer', 'Builder', 'Owner'];
// const powerBackupOptions = ['Full', 'Partial', 'No'];
// const yesNoOptions = ['Yes', 'No'];
// const unitsOptions = ['Sq.ft', 'Sq.yards', 'Acres', 'Sq.meters'];

// // Sample image URLs (replace with your actual image URLs)
// const sampleImages = [
//   'https://example.com/images/property1.jpg',
//   'https://example.com/images/property2.jpg',
//   'https://example.com/images/property3.jpg',
//   'https://example.com/images/property4.jpg',
//   'https://example.com/images/property5.jpg',
//   'https://example.com/images/property6.jpg',
//   'https://example.com/images/property7.jpg',
//   'https://example.com/images/property8.jpg',
//   'https://example.com/images/property9.jpg',
//   'https://example.com/images/property10.jpg',
// ];

// function randomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomFloat(min, max, decimals = 2) {
//   const value = min + Math.random() * (max - min);
//   return parseFloat(value.toFixed(decimals));
// }

// function randomDate(start, end) {
//   const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
//   return d.toISOString().slice(0, 19).replace('T', ' ');
// }

// function generatePhoneNumber() {
//   return `+91${randomInt(7000000000, 9999999999)}`;
// }

// function generateImageUrl(propertyId) {
//   // Generate a consistent but varied image URL for each property
//   const imageIndex = (propertyId % sampleImages.length);
//   return sampleImages[imageIndex];
// }

// function generateRow(id) {
//   const cityData = cities[randomInt(0, cities.length - 1)];
//   const area = cityData.areas[randomInt(0, cityData.areas.length - 1)];
//   const propertyType = propertyTypeOptions[randomInt(0, propertyTypeOptions.length - 1)];
//   const typeProperty = typeOptions[0]; // FORCED to 'sell'
//   const facing = facings[randomInt(0, facings.length - 1)];
//   const poster = postedBy[randomInt(0, postedBy.length - 1)];
//   const powerBackup = powerBackupOptions[randomInt(0, powerBackupOptions.length - 1)];
//   const yesNo = yesNoOptions[randomInt(0, yesNoOptions.length - 1)];
//   const units = unitsOptions[randomInt(0, unitsOptions.length - 1)];

//   const isPlotOrLand = propertyType === 'plot' || propertyType === 'land';
//   const isCommercial = propertyType.includes('commercial');

//   const bedrooms = isPlotOrLand ? 0 : randomInt(1, 6);
//   const bathrooms = isPlotOrLand ? 0 : randomInt(1, 5);
//   const floor = randomInt(0, 5);

//   const builtupArea = isPlotOrLand ? 0 : randomInt(500, 6000);
//   const siteArea = randomInt(500, 10000);
//   const length = randomFloat(50, 200, 2);
//   const width = randomFloat(50, 200, 2);
//   const roadwidth = randomFloat(20, 100, 2);
  
//   const min_acres = randomFloat(0.5, 5, 2);
//   const max_acres = min_acres + randomFloat(0.5, 10, 2);
//   const ratio = `${randomInt(1, 10)}:${randomInt(1, 10)}`;

//   let minBudget, maxBudget, price;

//   // Price logic
//   if (propertyType === 'plot') {
//     minBudget = randomInt(500000, 10000000);
//   } else if (propertyType === 'land') {
//     minBudget = randomInt(1000000, 50000000);
//   } else {
//     minBudget = randomInt(2000000, 30000000);
//   }
//   maxBudget = minBudget + randomInt(100000, 10000000);
//   price = randomInt(minBudget, maxBudget);

//   const coords = {
//     Delhi:     [28.6 + Math.random() * 0.2,  77.0 + Math.random() * 0.2],
//     Mumbai:    [19.0 + Math.random() * 0.15, 72.8 + Math.random() * 0.15],
//     Bangalore: [12.9 + Math.random() * 0.15, 77.5 + Math.random() * 0.2],
//     Hyderabad: [17.3 + Math.random() * 0.2,  78.4 + Math.random() * 0.2],
//     Chennai:   [13.0 + Math.random() * 0.15, 80.2 + Math.random() * 0.15],
//     Pune:      [18.5 + Math.random() * 0.1,  73.8 + Math.random() * 0.15],
//     Jaipur:    [26.8 + Math.random() * 0.2,  75.7 + Math.random() * 0.2],
//     Kolkata:   [22.5 + Math.random() * 0.15, 88.3 + Math.random() * 0.15],
//     Ahmedabad: [23.0 + Math.random() * 0.1,  72.5 + Math.random() * 0.15],
//     Kochi:     [9.9  + Math.random() * 0.1,  76.2 + Math.random() * 0.15],
//   };

//   const [lat, lng] = coords[cityData.city];
//   const createdAt = randomDate(new Date('2025-01-01'), new Date('2026-04-30'));
//   const boostDate = randomDate(new Date('2026-01-01'), new Date('2026-06-30'));
  
//   const description = `Beautiful ${propertyType} located in ${area}, ${cityData.city}. Prime location with great connectivity.`;
//   const comment = `Great investment opportunity in ${area}`;

//   return [
//     id,                                           // 1. property_id
//     `${area} ${propertyType} ${id}`,              // 2. property_name
//     propertyType,                                 // 3. property_type
//     price,                                        // 4. price
//     minBudget,                                    // 5. min_budget
//     maxBudget,                                    // 6. max_budget
//     lat,                                          // 7. lat
//     lng,                                          // 8. long
//     `${area}, ${cityData.city}`,                  // 9. location
//     `${area}, ${cityData.city}`,                  // 10. nearby
//     builtupArea,                                  // 11. buildup_area
//     siteArea,                                     // 12. site_area
//     bedrooms,                                     // 13. bedrooms_count
//     bathrooms,                                    // 14. bathrooms_count
//     floor,                                        // 15. floor
//     facing,                                       // 16. facing
//     description,                                  // 17. description
//     1,                                            // 18. status
//     'Approved',                                   // 19. Admin_status
//     randomInt(1, 100),                            // 20. user_id_id
//     poster,                                       // 21. posted_by
//     createdAt,                                    // 22. created_at
//     createdAt,                                    // 23. updated_at
//     typeProperty,                                 // 24. type (FORCED to 'sell')
//     null,                                         // 25. type_property
//     generatePhoneNumber(),                        // 26. mobile_no
//     null,                                         // 27. admin_mobile
//     min_acres,                                    // 28. min_acres
//     max_acres,                                    // 29. max_acres
//     ratio,                                        // 30. ratio
//     comment,                                      // 31. comment
//     roadwidth,                                    // 32. roadwidth
//     length,                                       // 33. length
//     width,                                        // 34. width
//     units,                                        // 35. units
//     randomInt(1, 10),                             // 36. no_of_flores
//     randomInt(0, 5),                              // 37. _1bhk_count
//     randomInt(0, 5),                              // 38. _2bhk_count
//     randomInt(0, 5),                              // 39. _3bhk_count
//     randomInt(0, 5),                              // 40. _4bhk_count
//     randomInt(1, 20),                             // 41. rooms_count
//     randomInt(0, 3),                              // 42. duplex_bedrooms
//     isCommercial ? randomInt(1, 10) : 0,          // 43. shop_count
//     propertyType === 'villa' ? randomInt(1, 5) : 0, // 44. house_count
//     randomInt(1, 5).toString(),                   // 45. balcony
//     powerBackup,                                  // 46. power_backup
//     yesNo,                                        // 47. gated_security
//     yesNo,                                        // 48. borewell
//     yesNo,                                        // 49. parking
//     randomInt(0, 1) ? 'Yes' : 'No',              // 50. lift
//     randomFloat(10000, 500000, 2),               // 51. advance_payment
//     boostDate,                                    // 52. boost_date
//     randomInt(1, 20)                              // 53. category_id_id
//   ];
// }

// async function generateData() {
//   const TOTAL_RECORDS = 100000;  // 1 LAKH records
//   const BATCH_SIZE = 1000;  // Insert 1000 at a time

//   const propertyColumns = `(property_id, property_name, property_type, price, min_budget, max_budget, 
//     lat, \`long\`, location, nearby, buildup_area, site_area, 
//     bedrooms_count, bathrooms_count, floor, facing, description, 
//     status, Admin_status, user_id_id, posted_by, created_at, updated_at, 
//     type, type_property, mobile_no, admin_mobile, min_acres, max_acres, 
//     ratio, comment, roadwidth, length, width, units, no_of_flores, 
//     _1bhk_count, _2bhk_count, _3bhk_count, _4bhk_count, rooms_count, 
//     duplex_bedrooms, shop_count, house_count, balcony, power_backup, 
//     gated_security, borewell, parking, lift, advance_payment, boost_date, category_id_id)`;

//   console.log(`📊 Starting SELL type data generation:`);
//   console.log(`   Total Properties: ${TOTAL_RECORDS.toLocaleString()}`);
//   console.log(`   Type: SELL (all records will have type='sell')`);
//   console.log(`   Property Type: plot or land`);
//   console.log(`   Each property will have 1 image\n`);

//   // Get current max property_id
//   const [maxIdResult] = await db.query('SELECT MAX(property_id) as max_id FROM property_property');
//   let propertyId = (maxIdResult[0].max_id || 0) + 1;
//   const startId = propertyId;
  
//   const startTime = Date.now();
  
//   async function insertBatch(properties, batchNum) {
//     const connection = await db.getConnection();
//     try {
//       await connection.beginTransaction();
      
//       // Insert properties
//       const placeholders = properties.map(() => `(${Array(53).fill('?').join(', ')})`).join(', ');
//       const values = properties.flat();
      
//       await connection.query(
//         `INSERT INTO property_property ${propertyColumns} VALUES ${placeholders}`,
//         values
//       );
      
//       // Insert images for each property
//       const imageValues = [];
//       for (const prop of properties) {
//         const property_id = prop[0];
//         const imageUrl = generateImageUrl(property_id);
//         imageValues.push([property_id, imageUrl]);
//       }
      
//       if (imageValues.length > 0) {
//         const imagePlaceholders = imageValues.map(() => '(?, ?)').join(', ');
//         const flatImageValues = imageValues.flat();
        
//         await connection.query(
//           `INSERT INTO property_property_images (property_id, image) VALUES ${imagePlaceholders}`,
//           flatImageValues
//         );
//       }
      
//       await connection.commit();
      
//       const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
//       const propRange = `${properties[0][0]} - ${properties[properties.length-1][0]}`;
//       console.log(`✅ Batch ${batchNum} | Properties ${propRange} | ${properties.length} props + ${properties.length} images | ${elapsed}s`);
      
//     } catch (error) {
//       await connection.rollback();
//       throw error;
//     } finally {
//       connection.release();
//     }
//   }

//   // Generate in batches
//   console.log('🚀 Generating properties and images...');
//   let batch = [];
//   let batchNum = 0;
//   let totalInserted = 0;
  
//   for (let i = 0; i < TOTAL_RECORDS; i++) {
//     const row = generateRow(propertyId);
//     // Ensure type is 'sell' (index 23)
//     row[23] = 'sell';
    
//     batch.push(row);
//     propertyId++;
    
//     // Insert batch when full
//     if (batch.length === BATCH_SIZE) {
//       batchNum++;
//       await insertBatch(batch, batchNum);
//       totalInserted += batch.length;
//       console.log(`   Progress: ${totalInserted.toLocaleString()}/${TOTAL_RECORDS.toLocaleString()} (${((totalInserted/TOTAL_RECORDS)*100).toFixed(1)}%)`);
//       batch = [];
//     }
//   }
  
//   // Insert remaining records
//   if (batch.length > 0) {
//     batchNum++;
//     await insertBatch(batch, batchNum);
//     totalInserted += batch.length;
//   }

//   const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
//   console.log(`\n✅ COMPLETE! ${totalInserted.toLocaleString()} properties inserted in ${totalTime} seconds`);
//   console.log(`   Each property has 1 image assigned`);
  
//   // Verify counts
//   const [propertyCount] = await db.query('SELECT COUNT(*) as count FROM property_property');
//   const [imageCount] = await db.query('SELECT COUNT(*) as count FROM property_property_images');
//   const [typeCount] = await db.query('SELECT type, COUNT(*) as count FROM property_property GROUP BY type');
//   const [propertyTypeCount] = await db.query('SELECT property_type, COUNT(*) as count FROM property_property GROUP BY property_type');
//   const [imagePropertyCount] = await db.query('SELECT COUNT(DISTINCT property_id) as count FROM property_property_images');
  
//   console.log(`\n📊 FINAL DATABASE COUNTS:`);
//   console.log(`   Total Properties: ${propertyCount[0].count.toLocaleString()}`);
//   console.log(`   Total Images: ${imageCount[0].count.toLocaleString()}`);
//   console.log(`   Properties with at least 1 image: ${imagePropertyCount[0].count.toLocaleString()}`);
//   console.log(`\n📊 Type Breakdown:`);
//   typeCount.forEach(row => {
//     console.log(`   ${row.type}: ${row.count.toLocaleString()} properties`);
//   });
//   console.log(`\n📊 Property Type Breakdown (plot/land):`);
//   propertyTypeCount.forEach(row => {
//     console.log(`   ${row.property_type}: ${row.count.toLocaleString()} properties`);
//   });
  
//   process.exit(0);
// }

// generateData().catch(console.error);









// const { db } = require('./server.js');

// const categories = [
//     'PLOT', 'LAND', 'COMMERCIAL LAND/PLOT', 'RENT WITH DUPLEX BUILDING', 
//     'DUPLEX HOUSE', 'RENTAL BUILDING', 'PG-OFFICES', 'FLAT', 'VILLA',
//     'COMMERCIAL BUILDING', 'APARTMENT'
// ];

// const cities = [
//     { city: 'Delhi', areas: ['Karol Bagh', 'Saket', 'Connaught Place', 'Dwarka', 'Rohini'] },
//     { city: 'Mumbai', areas: ['Goregaon', 'Powai', 'Juhu', 'Andheri', 'Bandra'] },
//     { city: 'Bangalore', areas: ['Whitefield', 'Electronic City', 'Bellandur', 'Marathahalli', 'Koramangala'] },
//     { city: 'Hyderabad', areas: ['Kondapur', 'Jubilee Hills', 'Nallagandla', 'Gachibowli', 'Madhapur'] },
//     { city: 'Chennai', areas: ['Tambaram', 'Besant Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
//     { city: 'Pune', areas: ['Balewadi', 'Magarpatta', 'Kharadi', 'Hinjewadi', 'Wakad'] },
//     { city: 'Jaipur', areas: ['C Scheme', 'Mansarovar', 'Tonk Road', 'Amber', 'Kukas'] },
//     { city: 'Kolkata', areas: ['Alipore', 'Behala', 'Salt Lake', 'Newtown', 'Ballygunge'] },
//     { city: 'Ahmedabad', areas: ['Bopal', 'SG Highway', 'Chandkheda', 'Navrangpura', 'Satellite'] },
//     { city: 'Kochi', areas: ['Fort Kochi', 'Marine Drive', 'Edapally', 'Kakkanad', 'Aluva'] },
// ];

// const propertyTypeOptions = ['plot', 'land'];
// const facings = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
// const postedBy = ['Agent', 'Developer', 'Builder', 'Owner'];
// const powerBackupOptions = ['Full', 'Partial', 'No'];
// const yesNoOptions = ['Yes', 'No'];
// const unitsOptions = ['Sq.ft', 'Sq.yards', 'Acres', 'Sq.meters'];

// const sampleImages = [
//     'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
//     'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
//     'https://images.unsplash.com/photo-1582407947304-fd86f028f716',
//     'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
//     'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf',
//     'https://images.unsplash.com/photo-1448630360428-65456885c650',
//     'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
//     'https://images.unsplash.com/photo-1523217582562-09d0c9937b6d',
//     'https://images.unsplash.com/photo-1494526585095-c41746248156',
//     'https://images.unsplash.com/photo-1533779283484-8ad4946aa28c',
// ];

// function randomInt(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomFloat(min, max, decimals = 2) {
//     const value = min + Math.random() * (max - min);
//     return parseFloat(value.toFixed(decimals));
// }

// function randomDate(start, end) {
//     const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
//     return d.toISOString().slice(0, 19).replace('T', ' ');
// }

// function generatePhoneNumber() {
//     return `+91${randomInt(7000000000, 9999999999)}`;
// }

// function generateImageUrl(propertyId) {
//     const imageIndex = propertyId % sampleImages.length;
//     return sampleImages[imageIndex];
// }

// async function insertCategories() {
//     console.log('📊 Inserting categories...');
//     for (const category of categories) {
//         await db.query(
//             'INSERT INTO property_categories (category) VALUES (?) ON DUPLICATE KEY UPDATE category = category',
//             [category]
//         );
//     }
//     console.log(`✅ Inserted ${categories.length} categories`);
// }

// async function generatePropertyData() {
//     const TOTAL_RECORDS = 100; // Change to 100000 for 1 lakh records
//     const BATCH_SIZE = 50;

//     console.log(`\n📊 Starting property data generation:`);
//     console.log(`   Total Properties: ${TOTAL_RECORDS.toLocaleString()}`);
//     console.log(`   Type: sell (all records)`);
//     console.log(`   Property Types: plot, land\n`);

//     const [maxIdResult] = await db.query('SELECT MAX(property_id) as max_id FROM properties');
//     let propertyId = (maxIdResult[0].max_id || 0) + 1;
//     const startTime = Date.now();

//     async function insertBatch(properties, images, batchNum) {
//         const connection = await db.getConnection();
//         try {
//             await connection.beginTransaction();

//             if (properties.length > 0) {
//                 // Count the number of columns (should be 58)
//                 const propertyPlaceholders = properties.map(() => 
//                     `(${Array(58).fill('?').join(', ')})`
//                 ).join(', ');
                
//                 await connection.query(
//                     `INSERT INTO properties (
//                         property_id, property_name, category_id, location, price, facing, 
//                         city_town, possession, created_at, boost_date, length, width, 
//                         posted_by, mobile_no, bank_pro_doc, bank_contact_details, units, 
//                         auction_start_datetime, auction_end_datetime, emd_amount, bid_increment, 
//                         site_area, roadwidth, user_id, lat, \`long\`, status, type, description, 
//                         property_type, min_budget, max_budget, nearby, buildup_area, bedrooms_count, 
//                         bathrooms_count, floor, min_acres, max_acres, ratio, comment, no_of_flores, 
//                         _1bhk_count, _2bhk_count, _3bhk_count, _4bhk_count, rooms_count, duplex_bedrooms, 
//                         shop_count, house_count, balcony, power_backup, gated_security, borewell, 
//                         parking, lift, advance_payment, updated_at
//                     ) VALUES ${propertyPlaceholders}`,
//                     properties.flat()
//                 );
//             }

//             if (images.length > 0) {
//                 const imagePlaceholders = images.map(() => '(?, ?)').join(', ');
//                 await connection.query(
//                     `INSERT INTO property_images (property_id, image_url) VALUES ${imagePlaceholders}`,
//                     images.flat()
//                 );
//             }

//             await connection.commit();
            
//             const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
//             console.log(`✅ Batch ${batchNum} | ${properties.length} properties + ${images.length} images | ${elapsed}s`);
            
//         } catch (error) {
//             await connection.rollback();
//             throw error;
//         } finally {
//             connection.release();
//         }
//     }

//     console.log('🚀 Generating properties and images...');
//     let propertyBatch = [];
//     let imageBatch = [];
//     let batchNum = 0;
//     let totalProperties = 0;

//     for (let i = 0; i < TOTAL_RECORDS; i++) {
//         const cityData = cities[randomInt(0, cities.length - 1)];
//         const area = cityData.areas[randomInt(0, cityData.areas.length - 1)];
//         const propertyType = propertyTypeOptions[randomInt(0, propertyTypeOptions.length - 1)];
//         const facing = facings[randomInt(0, facings.length - 1)];
//         const poster = postedBy[randomInt(0, postedBy.length - 1)];
//         const powerBackup = powerBackupOptions[randomInt(0, powerBackupOptions.length - 1)];
//         const yesNo = yesNoOptions[randomInt(0, yesNoOptions.length - 1)];
//         const units = unitsOptions[randomInt(0, unitsOptions.length - 1)];

//         const isPlotOrLand = propertyType === 'plot' || propertyType === 'land';
        
//         const bedrooms = isPlotOrLand ? 0 : randomInt(1, 6);
//         const bathrooms = isPlotOrLand ? 0 : randomInt(1, 5);
//         const floor = randomInt(0, 5);
        
//         const builtupArea = isPlotOrLand ? 0 : randomInt(500, 6000);
//         const siteArea = randomInt(500, 10000);
//         const length = randomFloat(50, 200, 2);
//         const width = randomFloat(50, 200, 2);
//         const roadwidth = randomFloat(20, 100, 2);
        
//         const min_acres = randomFloat(0.5, 5, 2);
//         const max_acres = min_acres + randomFloat(0.5, 10, 2);
//         const ratio = `${randomInt(1, 10)}:${randomInt(1, 10)}`;

//         let minBudget, maxBudget, price;
//         if (propertyType === 'plot') {
//             minBudget = randomInt(500000, 10000000);
//         } else {
//             minBudget = randomInt(1000000, 50000000);
//         }
//         maxBudget = minBudget + randomInt(100000, 10000000);
//         price = randomInt(minBudget, maxBudget);

//         const coords = {
//             Delhi: [28.6 + Math.random() * 0.2, 77.0 + Math.random() * 0.2],
//             Mumbai: [19.0 + Math.random() * 0.15, 72.8 + Math.random() * 0.15],
//             Bangalore: [12.9 + Math.random() * 0.15, 77.5 + Math.random() * 0.2],
//             Hyderabad: [17.3 + Math.random() * 0.2, 78.4 + Math.random() * 0.2],
//             Chennai: [13.0 + Math.random() * 0.15, 80.2 + Math.random() * 0.15],
//             Pune: [18.5 + Math.random() * 0.1, 73.8 + Math.random() * 0.15],
//             Jaipur: [26.8 + Math.random() * 0.2, 75.7 + Math.random() * 0.2],
//             Kolkata: [22.5 + Math.random() * 0.15, 88.3 + Math.random() * 0.15],
//             Ahmedabad: [23.0 + Math.random() * 0.1, 72.5 + Math.random() * 0.15],
//             Kochi: [9.9 + Math.random() * 0.1, 76.2 + Math.random() * 0.15],
//         };

//         const [lat, lng] = coords[cityData.city];
//         const createdAt = randomDate(new Date('2025-01-01'), new Date('2026-04-30'));
//         const boostDate = randomDate(new Date('2026-01-01'), new Date('2026-06-30'));
        
//         const description = `Beautiful ${propertyType} located in ${area}, ${cityData.city}. Prime location with great connectivity.`;
//         const comment = `Great investment opportunity in ${area}`;

//         const categoryId = randomInt(1, categories.length);

//         // Create property array with EXACTLY 58 values matching the columns
//         const property = [
//             propertyId,                                      // property_id
//             `${area} ${propertyType} ${propertyId}`,        // property_name
//             categoryId,                                      // category_id
//             `${area}, ${cityData.city}`,                    // location
//             price,                                           // price
//             facing,                                          // facing
//             cityData.city,                                   // city_town
//             'Immediate',                                     // possession
//             createdAt,                                       // created_at
//             boostDate,                                       // boost_date
//             length,                                          // length
//             width,                                           // width
//             poster,                                          // posted_by
//             generatePhoneNumber(),                           // mobile_no
//             null,                                            // bank_pro_doc
//             'Bank contact details here',                     // bank_contact_details
//             units,                                           // units
//             null,                                            // auction_start_datetime
//             null,                                            // auction_end_datetime
//             0,                                               // emd_amount
//             0,                                               // bid_increment
//             siteArea,                                        // site_area
//             roadwidth,                                       // roadwidth
//             randomInt(1, 100),                               // user_id
//             lat,                                             // lat
//             lng,                                             // long
//             'active',                                        // status
//             'sell',                                          // type
//             description,                                     // description
//             propertyType,                                    // property_type
//             minBudget,                                       // min_budget
//             maxBudget,                                       // max_budget
//             `${area}, ${cityData.city}`,                    // nearby
//             builtupArea,                                     // buildup_area
//             bedrooms,                                        // bedrooms_count
//             bathrooms,                                       // bathrooms_count
//             floor,                                           // floor
//             min_acres,                                       // min_acres
//             max_acres,                                       // max_acres
//             ratio,                                           // ratio
//             comment,                                         // comment
//             randomInt(1, 10),                                // no_of_flores
//             randomInt(0, 5),                                 // _1bhk_count
//             randomInt(0, 5),                                 // _2bhk_count
//             randomInt(0, 5),                                 // _3bhk_count
//             randomInt(0, 5),                                 // _4bhk_count
//             randomInt(1, 20),                                // rooms_count
//             randomInt(0, 3),                                 // duplex_bedrooms
//             0,                                               // shop_count
//             0,                                               // house_count
//             randomInt(1, 5).toString(),                      // balcony
//             powerBackup,                                     // power_backup
//             yesNo,                                           // gated_security
//             yesNo,                                           // borewell
//             yesNo,                                           // parking
//             randomInt(0, 1) ? 'Yes' : 'No',                 // lift
//             randomFloat(10000, 500000, 2),                   // advance_payment
//             createdAt                                        // updated_at
//         ];

//         // Verify the array has exactly 58 elements
//         if (property.length !== 58) {
//             console.error(`Property array has ${property.length} elements, expected 58`);
//             process.exit(1);
//         }

//         propertyBatch.push(property);
        
//         const numImages = randomInt(1, 3);
//         for (let img = 0; img < numImages; img++) {
//             imageBatch.push([propertyId, generateImageUrl(propertyId + img)]);
//         }
        
//         propertyId++;

//         if (propertyBatch.length === BATCH_SIZE) {
//             batchNum++;
//             await insertBatch(propertyBatch, imageBatch, batchNum);
//             totalProperties += propertyBatch.length;
//             console.log(`   Progress: ${totalProperties.toLocaleString()}/${TOTAL_RECORDS.toLocaleString()} (${((totalProperties/TOTAL_RECORDS)*100).toFixed(1)}%)`);
//             propertyBatch = [];
//             imageBatch = [];
//         }
//     }

//     if (propertyBatch.length > 0) {
//         batchNum++;
//         await insertBatch(propertyBatch, imageBatch, batchNum);
//         totalProperties += propertyBatch.length;
//     }

//     const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
//     console.log(`\n✅ COMPLETE! ${totalProperties.toLocaleString()} properties inserted in ${totalTime} seconds`);
    
//     const [propertyCount] = await db.query('SELECT COUNT(*) as count FROM properties');
//     const [imageCount] = await db.query('SELECT COUNT(*) as count FROM property_images');
    
//     console.log(`\n📊 FINAL DATABASE COUNTS:`);
//     console.log(`   Total Properties: ${propertyCount[0].count.toLocaleString()}`);
//     console.log(`   Total Images: ${imageCount[0].count.toLocaleString()}`);
// }

// async function main() {
//     try {
//         await insertCategories();
//         await generatePropertyData();
//         console.log('\n🎉 Data generation completed successfully!');
//         process.exit(0);
//     } catch (error) {
//         console.error('Error:', error);
//         process.exit(1);
//     }
// }

// main();



const { db } = require('./server.js');

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

const listingTypeOptions = ['sell', 'rent', 'lease'];
const propertyTypeOptions = ['plot', 'land', 'apartment', 'villa', 'commercial'];
const facings = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
const postedBy = ['Agent', 'Developer', 'Builder', 'Owner'];
const powerBackupOptions = ['Full', 'Partial', 'No'];
const yesNoOptions = ['Yes', 'No'];
const unitsOptions = ['Sq.ft', 'Sq.yards', 'Acres', 'Sq.meters'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((min + Math.random() * (max - min)).toFixed(decimals));

const randomDate = (start, end) => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const generatePhoneNumber = () => `+91${randomInt(7000000000, 9999999999)}`;

const cityCoords = {
  Delhi:     { lat: [28.6, 28.8], lng: [77.0, 77.2] },
  Mumbai:    { lat: [19.0, 19.15], lng: [72.8, 72.95] },
  Bangalore: { lat: [12.9, 13.05], lng: [77.5, 77.7] },
  Hyderabad: { lat: [17.3, 17.5], lng: [78.4, 78.6] },
  Chennai:   { lat: [13.0, 13.15], lng: [80.2, 80.35] },
  Pune:      { lat: [18.5, 18.6], lng: [73.8, 73.95] },
  Jaipur:    { lat: [26.8, 27.0], lng: [75.7, 75.9] },
  Kolkata:   { lat: [22.5, 22.65], lng: [88.3, 88.45] },
  Ahmedabad: { lat: [23.0, 23.1], lng: [72.5, 72.65] },
  Kochi:     { lat: [9.9, 10.0], lng: [76.2, 76.35] },
};

// Pre-generated values
const preGenerated = {
  phoneNumbers: Array(5000).fill().map(() => generatePhoneNumber()),
  descriptions: [
    'Beautiful property in prime location',
    'Excellent investment opportunity',
    'Well-maintained property with great amenities',
    'Spacious property with modern features',
    'Premium location with excellent connectivity'
  ],
  comments: [
    'Great investment opportunity',
    'Prime location property',
    'Excellent value for money',
    'High appreciation potential',
    'Ready to move in'
  ]
};

function generateRowFast(id) {
  const cityIndex = randomInt(0, cities.length - 1);
  const cityData = cities[cityIndex];
  const area = cityData.areas[randomInt(0, cityData.areas.length - 1)];
  const coords = cityCoords[cityData.city];
  
  const propertyType = propertyTypeOptions[randomInt(0, propertyTypeOptions.length - 1)];
  const listingType = listingTypeOptions[randomInt(0, listingTypeOptions.length - 1)];
  const facing = facings[randomInt(0, facings.length - 1)];
  const poster = postedBy[randomInt(0, postedBy.length - 1)];
  const powerBackup = powerBackupOptions[randomInt(0, powerBackupOptions.length - 1)];
  const yesNo = yesNoOptions[randomInt(0, yesNoOptions.length - 1)];
  const units = unitsOptions[randomInt(0, unitsOptions.length - 1)];

  const isPlotOrLand = propertyType === 'plot' || propertyType === 'land';
  const isCommercial = propertyType === 'commercial';

  const bedrooms = isPlotOrLand ? 0 : randomInt(1, 6);
  const bathrooms = isPlotOrLand ? 0 : randomInt(1, 5);
  const floor = randomInt(0, 5);

  const builtupArea = isPlotOrLand ? 0 : randomInt(500, 6000);
  const siteArea = randomInt(500, 10000);
  const length = randomFloat(50, 200, 2);
  const width = randomFloat(50, 200, 2);
  const roadwidth = randomFloat(20, 100, 2);
  
  const min_acres = randomFloat(0.5, 5, 2);
  const max_acres = min_acres + randomFloat(0.5, 10, 2);
  const ratio = `${randomInt(1, 10)}:${randomInt(1, 10)}`;

  let minBudget, maxBudget, price;

  if (propertyType === 'plot') {
    minBudget = randomInt(500000, 10000000);
  } else if (propertyType === 'land') {
    minBudget = randomInt(1000000, 50000000);
  } else if (propertyType === 'commercial') {
    minBudget = randomInt(5000000, 100000000);
  } else {
    minBudget = randomInt(2000000, 30000000);
  }
  
  if (listingType === 'rent') {
    price = randomInt(10000, 200000);
    maxBudget = price + randomInt(5000, 50000);
  } else if (listingType === 'lease') {
    price = randomInt(50000, 500000);
    maxBudget = price + randomInt(10000, 100000);
  } else {
    price = randomInt(minBudget, minBudget + randomInt(100000, 10000000));
    maxBudget = price + randomInt(100000, 10000000);
  }
  minBudget = listingType === 'sell' ? price : minBudget;

  const lat = coords.lat[0] + Math.random() * (coords.lat[1] - coords.lat[0]);
  const lng = coords.lng[0] + Math.random() * (coords.lng[1] - coords.lng[0]);
  
  const createdAt = randomDate(new Date('2025-01-01'), new Date('2026-04-30'));
  const boostDate = randomDate(new Date('2026-01-01'), new Date('2026-06-30'));
  const description = `${preGenerated.descriptions[id % preGenerated.descriptions.length]} ${propertyType} in ${area}, ${cityData.city}. For ${listingType}.`;
  const comment = preGenerated.comments[id % preGenerated.comments.length];
  const mobileNo = preGenerated.phoneNumbers[id % preGenerated.phoneNumbers.length];

  return [
    id, `${area} ${propertyType} ${id}`,
    propertyType, price, minBudget, maxBudget,
    parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)),
    `${area}, ${cityData.city}`, `${area}, ${cityData.city}`,
    builtupArea, siteArea, bedrooms, bathrooms, floor,
    facing, description, 1, 'Approved', randomInt(1, 100),
    poster, createdAt, createdAt, listingType, null,
    mobileNo, null, min_acres, max_acres, ratio, comment,
    roadwidth, length, width, units, randomInt(1, 10),
    randomInt(0, 5), randomInt(0, 5), randomInt(0, 5), randomInt(0, 5),
    randomInt(1, 20), randomInt(0, 3), isCommercial ? randomInt(1, 10) : 0,
    propertyType === 'villa' ? randomInt(1, 5) : 0,
    randomInt(1, 5).toString(), powerBackup, yesNo, yesNo, yesNo,
    randomInt(0, 1) ? 'Yes' : 'No', randomFloat(10000, 500000, 2),
    boostDate, randomInt(1, 20)
  ];
}

async function generateData() {
  const TOTAL_RECORDS = 100000; // 1 Lakh records
  const BATCH_SIZE = 500; // SMALLER BATCH SIZE - 500 records at a time (prevents packet too large error)
  
  console.log('='.repeat(60));
  console.log(`📊 STARTING DATA GENERATION - 1 LAKH RECORDS (100,000)`);
  console.log('='.repeat(60));
  console.log(`   Total Properties: ${TOTAL_RECORDS.toLocaleString()}`);
  console.log(`   Batch Size: ${BATCH_SIZE.toLocaleString()} records`);
  console.log(`   Total Batches: ${Math.ceil(TOTAL_RECORDS / BATCH_SIZE)}`);
  console.log(`   Listing Types: sell, rent, lease`);
  console.log(`   Property Types: plot, land, apartment, villa, commercial`);
  console.log('='.repeat(60) + '\n');

  const propertyColumns = `(property_id, property_name, property_type, price, min_budget, max_budget, 
    lat, \`long\`, location, nearby, buildup_area, site_area, 
    bedrooms_count, bathrooms_count, floor, facing, description, 
    status, Admin_status, user_id_id, posted_by, created_at, updated_at, 
    type, type_property, mobile_no, admin_mobile, min_acres, max_acres, 
    ratio, comment, roadwidth, length, width, units, no_of_flores, 
    _1bhk_count, _2bhk_count, _3bhk_count, _4bhk_count, rooms_count, 
    duplex_bedrooms, shop_count, house_count, balcony, power_backup, 
    gated_security, borewell, parking, lift, advance_payment, boost_date, category_id_id)`;

  let propertyId = 1;
  const startTime = Date.now();
  let totalInserted = 0;
  let batchNum = 0;
  
  async function insertBatch(properties, currentBatchNum) {
    // Build INSERT query
    const placeholders = properties.map(() => `(${Array(53).fill('?').join(', ')})`).join(', ');
    const values = properties.flat();
    
    await db.query(`INSERT INTO property_property ${propertyColumns} VALUES ${placeholders}`, values);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const percent = ((totalInserted + properties.length) / TOTAL_RECORDS * 100).toFixed(1);
    const rate = Math.round((totalInserted + properties.length) / (Date.now() - startTime) * 1000);
    console.log(`✅ Batch ${currentBatchNum} | ${properties.length} records | Total: ${(totalInserted + properties.length).toLocaleString()} (${percent}%) | ${elapsed}s | ${rate} rec/s`);
  }

  console.log('🚀 Generating and inserting properties in batches...\n');
  
  // Clear table first (optional - uncomment if you want fresh data)
  // await db.query('TRUNCATE TABLE property_property');
  // console.log('🗑️  Table truncated\n');
  
  while (propertyId <= TOTAL_RECORDS) {
    const batchProperties = [];
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECORDS - propertyId + 1);
    
    // Generate batch
    for (let j = 0; j < currentBatchSize; j++) {
      batchProperties.push(generateRowFast(propertyId));
      propertyId++;
    }
    
    // Insert batch
    batchNum++;
    await insertBatch(batchProperties, batchNum);
    totalInserted += currentBatchSize;
    
    // Small delay between batches to prevent overwhelming the database
    if (batchNum % 20 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`   💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const minutes = Math.floor(totalTime / 60);
  const seconds = (totalTime % 60).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ GENERATION COMPLETE!`);
  console.log(`   Total Records: ${TOTAL_RECORDS.toLocaleString()} properties`);
  console.log(`   Total Time: ${minutes}m ${seconds}s`);
  console.log(`   Average Speed: ${Math.round(TOTAL_RECORDS / totalTime)} records/second`);
  console.log('='.repeat(60));
  
  // Verify counts
  console.log('\n📊 VERIFYING DATABASE COUNTS...');
  const [propertyCount] = await db.query('SELECT COUNT(*) as count FROM property_property');
  const [typeCount] = await db.query('SELECT type, COUNT(*) as count FROM property_property GROUP BY type');
  const [propertyTypeCount] = await db.query('SELECT property_type, COUNT(*) as count FROM property_property GROUP BY property_type');
  
  console.log(`\n📊 FINAL DATABASE COUNTS:`);
  console.log(`   Total Properties: ${propertyCount.count.toLocaleString()}`);
  console.log(`\n📊 Listing Type Breakdown (sell/rent/lease):`);
  typeCount.forEach(row => {
    const percent = (row.count / TOTAL_RECORDS * 100).toFixed(1);
    console.log(`   ${row.type}: ${row.count.toLocaleString()} properties (${percent}%)`);
  });
  console.log(`\n📊 Property Type Breakdown:`);
  propertyTypeCount.forEach(row => {
    const percent = (row.count / TOTAL_RECORDS * 100).toFixed(1);
    console.log(`   ${row.property_type}: ${row.count.toLocaleString()} properties (${percent}%)`);
  });
  
  console.log('\n✨ Data generation completed successfully!');
  process.exit(0);
}

// Increase MySQL packet size temporarily (run this in MySQL first)
// SET GLOBAL max_allowed_packet=1073741824; -- 1GB

generateData().catch(console.error);