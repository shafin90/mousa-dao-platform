const Redis = require('ioredis');

/** @type {import('ioredis').Redis|null} */
let client = null;

/** @type {boolean} */
let connecting = false;

/**
 * Default Redis URL.
 * Uses environment variable REDIS_URL or falls back to localhost.
 * In Docker Compose, set REDIS_URL=redis://redis:6379
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Returns the singleton Redis client.
 *
 * On first call, creates and connects a new Redis client with:
 * - Lazy connect (doesn't block server start on failure)
 * - Auto-reconnect with exponential backoff (500ms - 3s)
 * - Max 5 retry attempts before falling back
 * - Reconnects on error
 *
 * FLOW:
 * 1. If client exists and ready → return it
 * 2. If a connection is already in progress → wait briefly and retry
 * 3. Create new ioredis client with retry strategy
 * 4. Attach event handlers for error/reconnect logging
 * 5. Connect and return the client
 * 6. On failure → return null (caller falls back to in-memory cache)
 *
 * @returns {Promise<import('ioredis').Redis|null>} Redis client or null if unavailable
 */
const getRedisClient = async () => {
  if (client && client.status === 'ready') return client;

  if (connecting) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getRedisClient();
  }

  connecting = true;

  try {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 5) {
          console.warn(
            '[Redis] Max retries reached, operating without Redis',
          );
          return null;
        }
        return Math.min(times * 500, 3000);
      },
      reconnectOnError: () => true,
      lazyConnect: true,
      enableReadyCheck: true,
    });

    client.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
    });

    client.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    client.on('connect', () => {
      console.log('[Redis] Client connected');
    });

    await client.connect();
    return client;
  } catch (err) {
    console.warn('[Redis] Connection failed:', err.message);
    console.warn('[Redis] Using in-memory fallback for caching');
    client = null;
    return null;
  } finally {
    connecting = false;
  }
};

/**
 * Checks if the Redis client is ready for use.
 *
 * @returns {boolean} true if Redis is connected and ready
 */
const isRedisReady = () => {
  return client !== null && client.status === 'ready';
};

module.exports = { getRedisClient, isRedisReady };
