const City = require('../models/City');

/**
 * Lists all cities for a company (alphabetical).
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findAll = async (companyId) => {
  return await City.find({ companyId }).sort({ name: 1 });
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

module.exports = { findAll, findById, create, updateOne, deleteOne };
