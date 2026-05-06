const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
  host: '2401:4900:62ca:1873:d9b7:9891:5676:3c31', // IPv6
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
connection.query('SELECT * FROM property_property_images LIMIT 5', (err, results) => {
  if (err) {
    console.error('❌ Query error:', err.message);
    return;
  }
  console.log('📊 Data:', results);
});

// Close connection
connection.end();