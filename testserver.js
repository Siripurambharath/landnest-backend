const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
  host: '2401:4900:9380:a12e:3072:e10:fc8c:a274', 
  user: 'root',
  password: 'Root@1234',
  database: 'landnest_db',
  port: 3306
});

// Connect to DB
connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL database!');
});

// Example query
connection.query('SELECT * FROM property_property LIMIT 5', (err, results) => {
  if (err) {
    console.error('❌ Query error:', err.message);
    return;
  }
  console.log('📊 Data:', results);
});

// Close connection
connection.end();
