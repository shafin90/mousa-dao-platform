const { getRedisClient } = require('../redis/client');

const HOLD_TTL_SECONDS = 600;

const holdSeats = async (tripId, seats, userId) => {
  const redis = await getRedisClient();
  if (!redis) return false;
  const key = `seat_hold:${tripId}`;
  const existing = await redis.hgetall(key);
  for (const seat of seats) {
    if (existing[seat] && existing[seat] !== userId) return false;
  }
  for (const seat of seats) {
    await redis.hset(key, seat, userId);
  }
  await redis.expire(key, HOLD_TTL_SECONDS);
  return true;
};

const releaseHeldSeats = async (tripId, seats) => {
  const redis = await getRedisClient();
  if (!redis) return;
  const key = `seat_hold:${tripId}`;
  await redis.hdel(key, ...seats);
};

const getHeldSeats = async (tripId) => {
  const redis = await getRedisClient();
  if (!redis) return {};
  const key = `seat_hold:${tripId}`;
  return await redis.hgetall(key) || {};
};

module.exports = { holdSeats, releaseHeldSeats, getHeldSeats };
