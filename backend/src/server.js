require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');
const { loadConsumers } = require('./queue/consumer.loader');
const { initSocket } = require('./socket/index');
const { getRedisClient } = require('./redis/client');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const server = http.createServer(app);

const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ Connected to MongoDB');

    await loadConsumers();
    console.log('✓ Queue consumers loaded');

    // Redis is REQUIRED for production-like real-time performance.
    // On failure the app still starts and falls back to in-memory cache.
    try {
      await getRedisClient();
      console.log('✓ Connected to Redis at', REDIS_URL);
    } catch (redisError) {
      console.warn(
        '⚠ Redis unavailable — using in-memory fallback:',
        redisError.message,
      );
    }

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
