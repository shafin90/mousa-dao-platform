const Bus = require('../models/Bus');

/**
 * Finds a bus by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Bus.findOne({ _id: id, companyId })
    .populate('assignedDriver', 'profile.firstName profile.lastName email profile.phone');
};

/**
 * Creates a bus record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await Bus.create(data);
};

/**
 * Lists buses for a company with optional filters.
 *
 * @param {string} companyId
 * @param {Object} filters - { status, type }
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{buses: Array, total: number}>}
 */
const findMany = async (companyId, filters = {}, page = 1, limit = 10) => {
  const query = { companyId, ...filters };
  const buses = await Bus.find(query)
    .populate('assignedDriver', 'profile.firstName profile.lastName email')
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Bus.countDocuments(query);
  return { buses, total };
};

/**
 * Updates a bus by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await Bus.findOneAndUpdate({ _id: id, companyId }, update, { new: true });
};

/**
 * Deletes a bus by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await Bus.findOneAndDelete({ _id: id, companyId });
};

/**
 * Finds buses matching a search (busNumber or name).
 *
 * @param {string} companyId
 * @param {RegExp} searchRegex
 * @returns {Promise<Array>}
 */
const search = async (companyId, searchRegex) => {
  return await Bus.find({ companyId, $or: [{ busNumber: searchRegex }, { name: searchRegex }] }).select('_id');
};

module.exports = { findById, create, findMany, updateOne, deleteOne, search };
