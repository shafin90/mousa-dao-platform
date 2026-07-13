const Audit = require('../audit.model');

/**
 * Creates an audit log entry (non-blocking).
 *
 * @param {Object} data - { companyId, userId, action, module, description, metadata, status, ipAddress, userAgent }
 */
const create = async (data) => {
  Audit.create(data).catch((err) => console.error('Audit log failed:', err));
};

/**
 * Creates an audit log entry and waits for completion.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createSync = async (data) => {
  return await Audit.create(data);
};

/**
 * Lists audit logs for a company with filters.
 *
 * @param {string} companyId
 * @param {Object} filters - { module, action, userId, status, startDate, endDate }
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{logs: Array, total: number}>}
 */
const findMany = async (companyId, filters = {}, page = 1, limit = 20) => {
  const query = { companyId };
  if (filters.module) query.module = filters.module;
  if (filters.action) query.action = filters.action;
  if (filters.userId) query.userId = filters.userId;
  if (filters.status) query.status = filters.status;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  const logs = await Audit.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'email');
  const total = await Audit.countDocuments(query);
  return { logs, total };
};

/**
 * Finds a single audit log by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Audit.findOne({ _id: id, companyId }).populate('userId', 'email');
};

module.exports = { create, createSync, findMany, findById };
