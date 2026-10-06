const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
  host: '2401:4900:4fd8:53d6:e17e:3b0e:bfd3:219', 
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
connection.query('SELECT * FROM users_user LIMIT 10', (err, results) => {
  if (err) {
    console.error('❌ Query error:', err.message);
    return;
  }
  console.log('📊 Data:', results);
});

// Close connection
connection.end();
