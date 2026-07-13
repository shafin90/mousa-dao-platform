const MaintenanceStaff = require('../models/MaintenanceStaff');

/**
 * Lists all maintenance staff for a company (alphabetical).
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findAll = async (companyId) => {
  return await MaintenanceStaff.find({ companyId }).populate('facilityId', 'name').sort({ name: 1 });
};

/**
 * Finds a maintenance staff member by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await MaintenanceStaff.findOne({ _id: id, companyId }).populate('facilityId', 'name');
};

/**
 * Creates a maintenance staff record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const staff = await MaintenanceStaff.create(data);
  return await MaintenanceStaff.findById(staff._id).populate('facilityId', 'name');
};

/**
 * Updates a maintenance staff member by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await MaintenanceStaff.findOneAndUpdate({ _id: id, companyId }, update, { new: true }).populate('facilityId', 'name');
};

/**
 * Deletes a maintenance staff member by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await MaintenanceStaff.findOneAndDelete({ _id: id, companyId });
};

module.exports = { findAll, findById, create, updateOne, deleteOne };
