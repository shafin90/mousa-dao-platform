const MaintenanceFacility = require('../models/MaintenanceFacility');

/**
 * Lists all maintenance facilities for a company (alphabetical).
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findAll = async (companyId) => {
  return await MaintenanceFacility.find({ companyId }).populate('cityId', 'name').sort({ name: 1 });
};

/**
 * Finds a maintenance facility by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await MaintenanceFacility.findOne({ _id: id, companyId }).populate('cityId', 'name');
};

/**
 * Creates a maintenance facility record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const facility = await MaintenanceFacility.create(data);
  return await MaintenanceFacility.findById(facility._id).populate('cityId', 'name');
};

/**
 * Updates a maintenance facility by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await MaintenanceFacility.findOneAndUpdate({ _id: id, companyId }, update, { new: true }).populate('cityId', 'name');
};

/**
 * Deletes a maintenance facility by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await MaintenanceFacility.findOneAndDelete({ _id: id, companyId });
};

module.exports = { findAll, findById, create, updateOne, deleteOne };
