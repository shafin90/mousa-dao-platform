const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../../../redis/client');

/**
 * Generates a JWT for an authenticated user.
 *
 * FLOW:
 * 1. Build payload with id, role, and companyId
 * 2. Sign with JWT_SECRET and configured expiry
 *
 * INPUT:
 * @param {Object} user - { _id, role, companyId }
 *
 * OUTPUT:
 * @returns {string} Signed JWT string
 *
 * SIDE EFFECTS: None
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * Decodes a JWT and returns the payload.
 *
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Adds a JWT to the Redis blacklist with TTL matching the token's remaining expiry.
 *
 * @param {string} token
 */
const blacklistToken = async (token) => {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return;
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
  if (expiresIn <= 0) return;
  const redis = await getRedisClient();
  if (redis) {
    await redis.set(`blacklist:${token}`, 'true', 'EX', expiresIn);
  }
};

/**
 * Checks whether a JWT is in the Redis blacklist.
 *
 * @param {string} token
 * @returns {Promise<boolean>}
 */
const isTokenBlacklisted = async (token) => {
  const redis = await getRedisClient();
  if (!redis) return false;
  const result = await redis.get(`blacklist:${token}`);
  return !!result;
};

/**
 * Generates a refresh JWT with a 30-day expiry.
 *
 * @param {Object} user - { _id }
 * @returns {string} Signed refresh JWT
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Decodes and verifies a refresh JWT.
 *
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const decodeRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  decodeToken,
  blacklistToken,
  isTokenBlacklisted,
  generateRefreshToken,
  decodeRefreshToken,
};
