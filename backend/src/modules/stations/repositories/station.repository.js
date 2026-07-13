const Station = require('../models/Station');

/**
 * Finds a station by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Station.findOne({ _id: id, companyId }).populate('cityId', 'name');
};

/**
 * Lists all stations for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findAll = async (companyId) => {
  return await Station.find({ companyId }).populate('cityId', 'name');
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
  return await Station.findOneAndUpdate({ _id: id, companyId }, update, { new: true });
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
