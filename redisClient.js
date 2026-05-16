const redis = require("redis");

const redisClient = redis.createClient({
socket: {
  host: "127.0.0.1",
port: 6379,
  connectTimeout: 10000,
  reconnectStrategy: (retries) => {
    if (retries > 10) {
      console.log("❌ Too many Redis reconnection attempts, stopping...");
      return new Error("Redis connection failed after 10 retries");
    }
    return Math.min(retries * 100, 3000);
  }
},
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("🔄 Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis connected and ready to use!");
});

redisClient.on("end", () => {
  console.log("⚠️ Redis connection closed");
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connection established");
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err.message);
    // Don't throw - allow app to run without Redis
  }
};

// Test the connection with a ping
const testRedisConnection = async () => {
  if (!redisClient.isReady) {
    console.log("⚠️ Redis not ready, skipping ping test");
    return false;
  }
  
  try {
    const pong = await redisClient.ping();
    console.log(`📡 Redis ping response: ${pong}`);
    return true;
  } catch (err) {
    console.error("❌ Redis ping failed:", err.message);
    return false;
  }
};

// Export both the client and helper functions
module.exports = { 
  redisClient, 
  connectRedis, 
  testRedisConnection 
};