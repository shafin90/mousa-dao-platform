const User = require('../models/User');

/**
 * Finds a user by ID and company, excluding the password field.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await User.findOne({ _id: id, companyId }).select('-password');
};

/**
 * Finds a user by ID (any company), excluding password.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const findByIdAny = async (id) => {
  return await User.findById(id).select('-password');
};

/**
 * Finds a user by email (used in login).
 *
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const findByEmail = async (email) => {
  return await User.findOne({ email });
};

/**
 * Finds a user by phone (used in login).
 *
 * @param {string} phone
 * @returns {Promise<Object|null>}
 */
const findByPhone = async (phone) => {
  return await User.findOne({ phone });
};

/**
 * Creates a new user.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const user = await User.create(data);
  return await User.findById(user._id).select('-password');
};

/**
 * Updates a user by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await User.findOneAndUpdate({ _id: id, companyId }, update, { new: true, runValidators: true }).select('-password');
};

/**
 * Finds users for a given company with optional filters.
 *
 * @param {string} companyId
 * @param {Object} filters - { role, search, page, limit }
 * @returns {Promise<{users: Array, total: number}>}
 */
const findMany = async (companyId, filters = {}) => {
  const { page = 1, limit = 10, role, search } = filters;
  const query = { companyId };
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  const users = await User.find(query).skip((page - 1) * limit).limit(Number(limit)).select('-password');
  const total = await User.countDocuments(query);
  return { users, total, page: Number(page), pages: Math.ceil(total / limit) };
};

/**
 * Deletes a user by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await User.findOneAndDelete({ _id: id, companyId });
};

/**
 * Finds a user by ID without excluding password.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const findByIdWithPassword = async (id) => {
  return await User.findById(id);
};

/**
 * Finds a user by a hashed reset-password token with an unexpired window.
 *
 * @param {string} hashedToken
 * @returns {Promise<Object|null>}
 */
const findByResetToken = async (hashedToken) => {
  return await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
};

/**
 * Sets the reset-password token and expiry on a user document.
 * Uses strict: false because resetPasswordToken/resetPasswordExpires
 * are not declared in the schema.
 *
 * @param {string} id
 * @param {string} hashedToken
 * @param {number} expires - epoch ms
 * @returns {Promise<Object|null>}
 */
const setResetToken = async (id, hashedToken, expires) => {
  return await User.findOneAndUpdate(
    { _id: id },
    { $set: { resetPasswordToken: hashedToken, resetPasswordExpires: expires } },
    { strict: false },
  );
};

/**
 * Clears the reset-password fields and sets a new password.
 *
 * @param {string} id
 * @param {string} hashedPassword
 * @returns {Promise<Object|null>}
 */
const clearResetTokenAndUpdatePassword = async (id, hashedPassword) => {
  return await User.findOneAndUpdate(
    { _id: id },
    {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: '', resetPasswordExpires: '' },
    },
    { strict: false },
  );
};

module.exports = {
  findById,
  findByIdAny,
  findByIdWithPassword,
  findByResetToken,
  setResetToken,
  clearResetTokenAndUpdatePassword,
  findByEmail,
  create,
  updateOne,
  findMany,
  deleteOne,
};
