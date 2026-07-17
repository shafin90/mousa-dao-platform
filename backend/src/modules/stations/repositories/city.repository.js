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
  return await City.find(query).sort({ country: 1, name: 1 });
};

/**
 * Finds a city by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await City.findOne({ _id: id, companyId });
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
  return await City.findOneAndUpdate({ _id: id, companyId }, update, { new: true });
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

module.exports = { findAll, findById, create, updateOne, deleteOne, findByNameAndCountry };
