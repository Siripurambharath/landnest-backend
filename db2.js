const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "map",
  waitForConnections: true,
  connectionLimit: 20
});

module.exports = pool;