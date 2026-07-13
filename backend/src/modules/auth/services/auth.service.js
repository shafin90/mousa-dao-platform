const bcrypt = require('bcryptjs');
const userRepository = require('../../users/repositories/user.repository');
const tenantRepository = require('../../tenants/repositories/tenant.repository');
const { generateToken } = require('./auth.token.service');
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
 * Authenticates a user by email and password.
 *
 * FLOW:
 * Step 1: Find user by email
 * Step 2: Compare password hash
 * Step 3: Check account lock status
 * Step 4: Generate JWT
 *
 * INPUT:
 * @param {string} email
 * @param {string} password
 *
 * OUTPUT:
 * @returns {Promise<{user: Object, token: string}>}
 *
 * SIDE EFFECTS: None
 */
const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid credentials', 401, ErrorCodes.INVALID_CREDENTIALS);
  }
  if (user.authTracking?.isLocked) {
    throw new AppError('Account is locked', 403, ErrorCodes.ACCOUNT_LOCKED);
  }
  const token = generateToken(user);
  return {
    user: { id: user._id, name: user.profile?.firstName, email: user.email, role: user.role, companyId: user.companyId },
    token,
  };
};

module.exports = { register, login };
