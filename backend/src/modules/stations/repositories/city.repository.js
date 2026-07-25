const City = require('../models/City');

/**
 * Lists all cities for a company (alphabetical).
 *
 * @param {string} companyId
 * @param {Object} [filters]
 * @returns {Promise<Array>}
 */
const findAll = async (companyId, filters = {}) => {
  const query = { companyId };
  if (filters.country) query.country = filters.country;
  if (filters.search) query.name = { $regex: filters.search, $options: 'i' };
  if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true' || filters.isActive === true;
  return await City.find(query).sort({ country: 1, name: 1 }).populate('manager1 manager2', 'profile.firstName profile.lastName email');
};

/**
 * Paginated version of findAll.
 *
 * @param {string} companyId
 * @param {Object} [filters]
 * @param {number} page - 1-indexed page number
 * @param {number} limit - items per page
 * @returns {Promise<{items: Array, total: number}>}
 */
const findAllPaginated = async (companyId, filters = {}, page = 1, limit = 20) => {
  const query = { companyId };
  if (filters.country) query.country = filters.country;
  if (filters.search) query.name = { $regex: filters.search, $options: 'i' };
  if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true' || filters.isActive === true;
  const [items, total] = await Promise.all([
    City.find(query)
      .sort({ country: 1, name: 1 })
      .populate('manager1 manager2', 'profile.firstName profile.lastName email')
      .skip((page - 1) * limit)
      .limit(limit),
    City.countDocuments(query),
  ]);
  return { items, total };
};

/**
 * Finds a city by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await City.findOne({ _id: id, companyId }).populate('manager1 manager2 createdBy', 'profile.firstName profile.lastName email');
};

/**
 * Creates a city record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await City.create(data);
};

/**
 * Updates a city by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await City.findOneAndUpdate({ _id: id, companyId }, update, { new: true })
    .populate('manager1 manager2 createdBy', 'profile.firstName profile.lastName email');
};

/**
 * Deletes a city by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await City.findOneAndDelete({ _id: id, companyId });
};

const findByNameAndCountry = async (companyId, name, country) => {
  return await City.findOne({ companyId, name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, country });
};

module.exports = { findAll, findAllPaginated, findById, create, updateOne, deleteOne, findByNameAndCountry };
