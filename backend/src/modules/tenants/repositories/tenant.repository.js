const Tenant = require('../models/Tenant');

/**
 * Finds a tenant by ID.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  return await Tenant.findById(id);
};

/**
 * Creates a tenant.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await Tenant.create(data);
};

/**
 * Finds a tenant by email.
 *
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const findByEmail = async (email) => {
  return await Tenant.findOne({ email });
};

/**
 * Lists tenants with optional filters.
 *
 * @param {Object} filters - { status, plan }
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{tenants: Array, total: number}>}
 */
const findMany = async (filters = {}, page = 1, limit = 20) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.plan) query.plan = filters.plan;
  const tenants = await Tenant.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  const total = await Tenant.countDocuments(query);
  return { tenants, total };
};

/**
 * Updates a tenant by ID.
 *
 * @param {string} id
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, update) => {
  return await Tenant.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

module.exports = { findById, create, findByEmail, findMany, updateOne };
