const Station = require('../models/Station');

/**
 * Finds a station by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Station.findOne({ _id: id, companyId })
    .populate('cityId', 'name country')
    .populate('manager1 manager2 createdBy', 'profile.firstName profile.lastName email');
};

/**
 * Lists all stations for a company with pagination.
 *
 * @param {string} companyId
 * @param {Object} [filters={}]
 * @param {number} [page=1]
 * @param {number} [limit=50]
 * @returns {Promise<{items: Array, total: number}>}
 */
const findAll = async (companyId, filters = {}, page = 1, limit = 50) => {
  const query = { companyId };
  if (filters.cityId) query.cityId = filters.cityId;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Station.find(query).populate('cityId', 'name country').populate('manager1 manager2 createdBy', 'profile.firstName profile.lastName email').skip(skip).limit(limit),
    Station.countDocuments(query),
  ]);
  return { items, total };
};

/**
 * Creates a station.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await Station.create(data);
};

/**
 * Updates a station by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await Station.findOneAndUpdate({ _id: id, companyId }, update, { new: true })
    .populate('cityId', 'name country')
    .populate('manager1 manager2 createdBy', 'profile.firstName profile.lastName email');
};

/**
 * Deletes a station by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await Station.findOneAndDelete({ _id: id, companyId });
};

/**
 * Finds stations matching a name within company.
 *
 * @param {string} companyId
 * @param {RegExp} searchRegex
 * @returns {Promise<Array>}
 */
const search = async (companyId, searchRegex) => {
  return await Station.find({ companyId, name: searchRegex }).select('_id');
};

module.exports = { findById, findAll, create, updateOne, deleteOne, search };
