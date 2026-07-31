const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepository = require('../../users/repositories/user.repository');
const tenantRepository = require('../../tenants/repositories/tenant.repository');
const { generateToken, generateRefreshToken, decodeRefreshToken } = require('./auth.token.service');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Hashes a plain-text password using bcrypt.
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Validates tenant exists and is active if companyId is provided.
 *
 * @param {string|null} companyId
 * @returns {Promise<void>}
 */
const validateTenant = async (companyId) => {
  if (!companyId) return;
  const tenant = await tenantRepository.findById(companyId);
  if (!tenant) throw new AppError('Company not found', 404, ErrorCodes.TENANT_NOT_FOUND);
  if (tenant.status !== 'active') throw new AppError('Company is suspended', 403, ErrorCodes.TENANT_SUSPENDED);
};

/**
 * Splits a full name into first and last name.
 *
 * @param {string} name
 * @returns {{ firstName: string, lastName: string }}
 */
const splitName = (name) => {
  const [firstName = name, ...lastParts] = (name || '').split(' ');
  return { firstName, lastName: lastParts.join(' ') || '' };
};

/**
 * Registers a new user and returns JWT.
 *
 * FLOW:
 * Step 1: Validate tenant (if companyId provided)
 * Step 2: Hash password
 * Step 3: Split name into first/last
 * Step 4: Create user in DB
 * Step 5: Generate JWT
 *
 * INPUT:
 * @param {Object} userData - { name, email, phone, password, role, companyId }
 *
 * OUTPUT:
 * @returns {Promise<{user: Object, token: string}>}
 *
 * SIDE EFFECTS: Creates a user in DB
 */
const register = async (userData) => {
  const { name, password, companyId, ...rest } = userData;
  await validateTenant(companyId);

  const hashed = await hashPassword(password);
  const { firstName, lastName } = splitName(name);

  const user = await userRepository.create({
    ...rest,
    companyId,
    password: hashed,
    profile: { firstName, lastName },
  });

  const token = generateToken(user);
  return { user: { id: user._id, email: user.email, role: user.role, companyId: user.companyId }, token };
};

/**
 * Authenticates a user by email (or phone) and password.
 *
 * INPUT:
 * @param {Object} credentials - { email?, phone?, password }
 *
 * OUTPUT:
 * @returns {Promise<{user: Object, token: string}>}
 */
const login = async ({ email, phone, password }) => {
  let user;
  if (email) {
    user = await userRepository.findByEmail(email);
  } else if (phone) {
    user = await userRepository.findByPhone(phone);
  }
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS);
  }
  if (user.authTracking?.isLocked) {
    throw new AppError('Account is locked', 403, ErrorCodes.ACCOUNT_LOCKED);
  }
  const token = generateToken(user);
  return {
    user: { id: user._id, name: user.profile?.firstName, email: user.email, phone: user.phone, role: user.role, companyId: user.companyId },
    token,
  };
};

/**
 * Sets a password for the authenticated user (used after Firebase signup).
 *
 * INPUT:
 * @param {string} userId
 * @param {string} companyId
 * @param {string} password
 *
 * OUTPUT:
 * @returns {Promise<{message: string}>}
 */
const setPassword = async (userId, companyId, password) => {
  const hashed = await hashPassword(password);
  await userRepository.updateOne(userId, companyId, { password: hashed });
  return { message: 'Password set successfully' };
};

/**
 * Initiates a password-reset flow.
 *
 * Generates a random token, stores a SHA-256 hash on the user document
 * with a 1-hour expiry, and returns the raw token.
 *
 * @param {string} email
 * @returns {Promise<{message: string, resetToken?: string}>}
 */
const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = Date.now() + 3600000; // 1 hour

  await userRepository.setResetToken(user._id, hashedToken, expires);

  // In production this would be emailed; returned here for development/testing
  return { message: 'If that email is registered, a reset link has been sent.', resetToken };
};

/**
 * Completes a password-reset using a token from the forgot-password flow.
 *
 * @param {string} token - Raw (unhashed) reset token
 * @param {string} password - New plain-text password
 * @returns {Promise<{message: string}>}
 */
const resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userRepository.findByResetToken(hashedToken);
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400, ErrorCodes.INVALID_TOKEN);
  }

  const hashed = await hashPassword(password);
  await userRepository.clearResetTokenAndUpdatePassword(user._id, hashed);

  return { message: 'Password has been reset successfully' };
};

/**
 * Changes the password for an authenticated user.
 *
 * @param {string} userId
 * @param {string} companyId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{message: string}>}
 */
const changePassword = async (userId, companyId, currentPassword, newPassword) => {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401, ErrorCodes.INVALID_CREDENTIALS);
  }

  const hashed = await hashPassword(newPassword);
  await userRepository.updateOne(userId, companyId, { password: hashed });

  return { message: 'Password changed successfully' };
};

/**
 * Issues a new access + refresh token pair from a valid refresh token.
 *
 * @param {string} refreshToken
 * @returns {Promise<{token: string, refreshToken: string}>}
 */
const refreshTokenFn = async (refreshToken) => {
  const decoded = decodeRefreshToken(refreshToken);
  const user = await userRepository.findByIdAny(decoded.id);
  if (!user) {
    throw new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  }

  const token = generateToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return { token, refreshToken: newRefreshToken };
};

module.exports = {
  register,
  login,
  setPassword,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken: refreshTokenFn,
};
