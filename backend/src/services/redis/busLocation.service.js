const { getRedisClient, isRedisReady } = require('../../redis/client');

/**
 * ──────────────────────────────────────────────
 * Redis Bus Location Service
 * ──────────────────────────────────────────────
 *
 * KEY FORMAT:
 *   bus:{companyId}:{busId}
 *
 * VALUE FORMAT:
 *   JSON string of { companyId, busId, tripId, latitude, longitude, speed, heading, updatedAt }
 *
 * TTL: 3600 seconds (1 hour) — enough for live tracking.
 *       Stale entries auto-expire so we never serve outdated positions.
 *
 * FALLBACK BEHAVIOR:
 *   If Redis is unavailable, an in-memory Map is used as temporary cache.
 *   Entries expire after 60 seconds to prevent stale data buildup.
 *   A single warning is logged on first fallback to avoid log spam.
 *
 * TENANT ISOLATION:
 *   All keys are prefixed with bus:{companyId}, so scanning by company
 *   is fast and cross-tenant data leakage is impossible.
 */

const REDIS_TTL = 3600;
const MEMORY_TTL_MS = 60_000;

/** @type {Map<string, { data: Object, expiresAt: number }>} */
const memoryStore = new Map();
let memoryWarningLogged = false;

/**
 * Builds the Redis key for a bus location.
 *
 * @param {string} companyId - Tenant/ObjectId
 * @param {string} busId - Bus/ObjectId
 * @returns {string} Redis key in format bus:{companyId}:{busId}
 */
const getKey = (companyId, busId) => `bus:${companyId}:${busId}`;

/**
 * Logs a one-time warning about in-memory fallback activation.
 *
 * @returns {void}
 */
const logMemoryFallback = () => {
  if (!memoryWarningLogged) {
    console.warn(
      '[BusLocationService] Redis unavailable — using in-memory fallback',
    );
    memoryWarningLogged = true;
  }
};

/**
 * Stores the latest GPS location for a bus.
 *
 * Primary target: Redis with 1-hour TTL.
 * Fallback target: in-memory Map with 60-second TTL.
 *
 * @param {string} companyId - Tenant/ObjectId
 * @param {string} busId - Bus/ObjectId
 * @param {Object} data - Location payload
 * @param {string} data.companyId
 * @param {string} data.busId
 * @param {string} data.tripId
 * @param {number} data.latitude
 * @param {number} data.longitude
 * @param {number} data.speed
 * @param {number} data.heading
 * @param {string} data.updatedAt - ISO 8601
 * @returns {Promise<void>}
 */
const setBusLocation = async (companyId, busId, data) => {
  const client = await getRedisClient();
  const key = getKey(companyId, busId);
  const value = JSON.stringify(data);

  if (client && isRedisReady()) {
    try {
      await client.set(key, value, 'EX', REDIS_TTL);
      return;
    } catch (err) {
      console.warn('[BusLocationService] Redis SET failed:', err.message);
    }
  }

  logMemoryFallback();
  memoryStore.set(key, { data, expiresAt: Date.now() + MEMORY_TTL_MS });
};

/**
 * Retrieves the latest GPS location for a single bus.
 *
 * @param {string} companyId
 * @param {string} busId
 * @returns {Promise<Object|null>} Location data or null if not found
 */
const getBusLocation = async (companyId, busId) => {
  const client = await getRedisClient();
  const key = getKey(companyId, busId);

  if (client && isRedisReady()) {
    try {
      const raw = await client.get(key);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('[BusLocationService] Redis GET failed:', err.message);
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  memoryStore.delete(key);
  return null;
};

/**
 * Retrieves locations for multiple buses in a single round-trip.
 *
 * Uses Redis MGET for efficiency. Falls back to iterating the in-memory store.
 *
 * @param {string} companyId
 * @param {string[]} busIds
 * @returns {Promise<Object[]>} Array of location objects, newest first
 */
const getMultipleBusLocations = async (companyId, busIds) => {
  if (!busIds.length) return [];

  const client = await getRedisClient();

  if (client && isRedisReady()) {
    try {
      const keys = busIds.map((id) => getKey(companyId, id));
      const results = await client.mget(...keys);
      return results
        .filter(Boolean)
        .map((r) => JSON.parse(r))
        .sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        );
    } catch (err) {
      console.warn(
        '[BusLocationService] Redis MGET failed:',
        err.message,
      );
    }
  }

  // In-memory fallback
  const now = Date.now();
  return busIds
    .map((id) => {
      const entry = memoryStore.get(getKey(companyId, id));
      if (entry && entry.expiresAt > now) return entry.data;
      memoryStore.delete(getKey(companyId, id));
      return null;
    })
    .filter(Boolean);
};

/**
 * Retrieves ALL bus locations for a company using Redis SCAN.
 *
 * SCAN is used instead of KEYS to avoid blocking Redis on large datasets.
 * Pattern: bus:{companyId}:*
 *
 * @param {string} companyId
 * @returns {Promise<Object[]>} Array of location objects, newest first
 */
const getAllBusLocationsForCompany = async (companyId) => {
  const client = await getRedisClient();

  if (client && isRedisReady()) {
    try {
      const pattern = `bus:${companyId}:*`;
      const results = [];
      let cursor = '0';

      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          const values = await client.mget(...keys);
          values
            .filter(Boolean)
            .forEach((v) => results.push(JSON.parse(v)));
        }
      } while (cursor !== '0');

      return results.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      );
    } catch (err) {
      console.warn(
        '[BusLocationService] Redis SCAN failed:',
        err.message,
      );
    }
  }

  // In-memory fallback
  const prefix = getKey(companyId, '');
  const now = Date.now();
  return Array.from(memoryStore.entries())
    .filter(([key]) => key.startsWith(prefix))
    .map(([, entry]) => {
      if (entry.expiresAt > now) return entry.data;
      memoryStore.delete(key);
      return null;
    })
    .filter(Boolean);
};

/**
 * Deletes a bus location key from both Redis and memory store.
 *
 * @param {string} companyId
 * @param {string} busId
 * @returns {Promise<void>}
 */
const deleteBusLocation = async (companyId, busId) => {
  const client = await getRedisClient();
  const key = getKey(companyId, busId);

  if (client && isRedisReady()) {
    try {
      await client.del(key);
    } catch (err) {
      console.warn('[BusLocationService] Redis DEL failed:', err.message);
    }
  }

  memoryStore.delete(key);
};

/**
 * Deletes ALL bus locations for a company (e.g., when a tenant is suspended).
 *
 * Uses SCAN + DEL pattern to safely remove all matching keys.
 *
 * @param {string} companyId
 * @returns {Promise<void>}
 */
const deleteCompanyLocations = async (companyId) => {
  const client = await getRedisClient();

  if (client && isRedisReady()) {
    try {
      const pattern = `bus:${companyId}:*`;
      let cursor = '0';

      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');

      return;
    } catch (err) {
      console.warn(
        '[BusLocationService] Redis deleteCompanyLocations failed:',
        err.message,
      );
    }
  }

  // Clear matching in-memory entries
  const prefix = getKey(companyId, '');
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
};

module.exports = {
  setBusLocation,
  getBusLocation,
  getMultipleBusLocations,
  getAllBusLocationsForCompany,
  deleteBusLocation,
  deleteCompanyLocations,
};
