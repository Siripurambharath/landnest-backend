const express = require("express");

const cors = require("cors");
require("dotenv").config();
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Database connection pool
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "landnest",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306
});

// ✅ Export db (CommonJS way)
module.exports.db = db;

// ✅ Import routes (CommonJS)
const propertyRoutes = require("./propertyRoutes");
app.use("/api/properties", propertyRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mysql from 'mysql2/promise';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // Database connection pool - HARDCODED CREDENTIALS
// export const db = mysql.createPool({
//     host: '2401:4900:62ca:1873:d9b7:9891:5676:3c31', // IPv6
//   user: 'root',
//   password: 'Root@1234',
//   database: 'landnest_db',
//   waitForConnections: true,
//   connectionLimit: 10,  // Changed from 20 to 10 as you requested
//   queueLimit: 0,
//   port: 3306         // MySQL default port
// });

// // Import routes
// import propertyRoutes from './propertyRoutes.js';
// app.use('/api/properties', propertyRoutes);

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });