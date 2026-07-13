const Payment = require('../models/Payment');

/**
 * Finds a payment by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Payment.findOne({ _id: id, companyId });
};

/**
 * Finds a payment by transaction reference scoped to company.
 *
 * @param {string} txRef
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findByTxRef = async (txRef, companyId) => {
  return await Payment.findOne({ tx_ref: txRef, companyId });
};

/**
 * Creates a payment record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await Payment.create(data);
};

/**
 * Atomically updates a payment that is in pending or processing status.
 *
 * @param {string} txRef
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateProcessing = async (txRef, companyId, update) => {
  return await Payment.findOneAndUpdate(
    { tx_ref: txRef, companyId, status: { $in: ['pending', 'processing'] } },
    update,
    { new: true }
  );
};

/**
 * Lists payments for a company with filters.
 *
 * @param {string} companyId
 * @param {Object} filters - { status, method, userId }
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{payments: Array, total: number}>}
 */
const findMany = async (companyId, filters = {}, page = 1, limit = 10) => {
  const query = { companyId, ...filters };
  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId bookingId');
  const total = await Payment.countDocuments(query);
  return { payments, total };
};

/**
 * Finds all payments for a specific user within a company.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findByUser = async (userId, companyId) => {
  return await Payment.find({ userId, companyId });
};

/**
 * Counts payments by status for a company.
 *
 * @param {string} companyId
 * @param {string} status
 * @returns {Promise<number>}
 */
const countByStatus = async (companyId, status) => {
  return await Payment.countDocuments({ companyId, status });
};

module.exports = { findById, findByTxRef, create, updateProcessing, findMany, findByUser, countByStatus };
