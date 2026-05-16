// const express = require("express");

// const cors = require("cors");
// require("dotenv").config();
// const mysql = require("mysql2/promise");

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // ✅ Database connection pool
// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "landnest",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   port: 3306
// });

// // ✅ Export db (CommonJS way)
// module.exports.db = db;

// // ✅ Import routes (CommonJS)
// const propertyRoutes = require("./propertyRoutes");
// app.use("/api/properties", propertyRoutes);
// const vendorRoutes = require("./vendorRoutes"); 
// app.use("/api/vendors", vendorRoutes); 

// const paginatedPropertyRoutes = require("./paginatedPropertyRoutes");
// app.use("/api", paginatedPropertyRoutes); // This will handle /api/properties/sell/non-admin


// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const { redisClient, connectRedis, testRedisConnection } = require("./redisClient");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION POOL =================
const db = mysql.createPool({
  host: "2401:4900:9380:a12e:3072:e10:fc8c:a274", // IPv6
  user: "root",
  password: "Root@1234",
  database: "landnest_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
});

// Export db for other files
module.exports.db = db;

// ================= REDIS MIDDLEWARE =================
// Optional: Add Redis availability to request object
app.use((req, res, next) => {
  req.redisClient = redisClient;
  req.redisAvailable = redisClient.isReady;
  next();
});

// ================= ROUTES =================
const propertyRoutes = require("./propertyRoutes");
const vendorRoutes = require("./vendorRoutes");
const paginatedPropertyRoutes = require("./paginatedPropertyRoutes");
const Usermodule = require("./Usermodule"); // Add user routes
const propertyRequest = require('./PropertyRequest');

app.use('/property-request', propertyRequest)
app.use("/api/properties", propertyRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api", paginatedPropertyRoutes);
app.use("/api", Usermodule); // Add user module routes
// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("Landnest Backend Server is Running 🚀");
});

// Redis status endpoint
app.get("/redis-status", (req, res) => {
  res.json({
    connected: redisClient.isReady,
    status: redisClient.isReady ? "ready" : "disconnected"
  });
});

// ================= START SERVER =================
const startServer = async () => {
  try {
    // Connect to Redis (non-blocking - won't crash if fails)
    await connectRedis();
    
    // Test Redis connection if connected
    if (redisClient.isReady) {
      await testRedisConnection();
      console.log("✅ Redis caching available");
    } else {
      console.log("⚠️ Redis not available - running without cache");
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    // Start server anyway even if Redis fails
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} (without Redis cache)`);
    });
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  if (redisClient.isReady) {
    await redisClient.quit();
  }
  process.exit(0);
});

startServer();  