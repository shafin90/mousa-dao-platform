const jwt = require('jsonwebtoken');

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

module.exports = { generateToken, decodeToken };
