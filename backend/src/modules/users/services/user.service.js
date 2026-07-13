const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Creates a new user within a company.
 *
 * @param {string} companyId
 * @param {Object} data - { email, phone, password, role, firstName, lastName }
 * @returns {Promise<Object>}
 */
const createUser = async (companyId, data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await userRepository.create({
    companyId,
    email: data.email,
    phone: data.phone,
    password: hashedPassword,
    role: data.role,
    profile: { firstName: data.firstName, lastName: data.lastName },
  });
};

/**
 * Fetches own profile (any company).
 *
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
const getMyProfile = async (userId) => {
  return await userRepository.findByIdAny(userId);
};

/**
 * Updates own profile.
 *
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
const updateMyProfile = async (userId, updateData) => {
  return await userRepository.updateOne(userId, null, updateData);
};

/**
 * Lists users within a company with pagination.
 *
 * @param {string} companyId
 * @param {Object} query - { page, limit, role, search }
 * @returns {Promise<Object>}
 */
const getAllUsers = async (companyId, query) => {
  return await userRepository.findMany(companyId, query);
};

/**
 * Fetches a user by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getUserById = async (id, companyId) => {
  const user = await userRepository.findById(id, companyId);
  if (!user) throw new AppError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  return user;
};

/**
 * Updates a user's locked status.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {boolean} isActive
 * @returns {Promise<Object|null>}
 */
const updateUserStatus = async (id, companyId, isActive) => {
  return await userRepository.updateOne(id, companyId, { 'authTracking.isLocked': !isActive });
};

/**
 * Updates a user's role.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {string} role
 * @returns {Promise<Object|null>}
 */
const updateUserRole = async (id, companyId, role) => {
  return await userRepository.updateOne(id, companyId, { role });
};

/**
 * Updates user fields by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateUser = async (id, companyId, data) => {
  const update = {};
  if (data.firstName || data.lastName) {
    update.profile = {};
    if (data.firstName) update.profile.firstName = data.firstName;
    if (data.lastName) update.profile.lastName = data.lastName;
  }
  if (data.email) update.email = data.email;
  if (data.phone) update.phone = data.phone;
  if (data.role) update.role = data.role;
  if (data.password) update.password = await bcrypt.hash(data.password, 10);

  return await userRepository.updateOne(id, companyId, update);
};

/**
 * Deletes a user by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteUser = async (id, companyId) => {
  return await userRepository.deleteOne(id, companyId);
};

module.exports = { createUser, getMyProfile, updateMyProfile, getAllUsers, getUserById, updateUserStatus, updateUserRole, updateUser, deleteUser };
