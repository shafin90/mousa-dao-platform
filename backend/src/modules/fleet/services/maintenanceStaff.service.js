const maintenanceStaffRepository = require('../repositories/maintenanceStaff.repository');

/**
 * Lists all maintenance staff for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getAllStaff = async (companyId) => {
  return await maintenanceStaffRepository.findAll(companyId);
};

/**
 * Fetches a single maintenance staff member by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getStaffById = async (id, companyId) => {
  return await maintenanceStaffRepository.findById(id, companyId);
};

/**
 * Creates a maintenance staff member.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createStaff = async (companyId, data) => {
  const payload = { ...data, companyId };
  if (!payload.facilityId) delete payload.facilityId;
  return await maintenanceStaffRepository.create(payload);
};

/**
 * Updates a maintenance staff member.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateStaff = async (id, companyId, data) => {
  const payload = { ...data };
  if (Object.prototype.hasOwnProperty.call(payload, 'facilityId') && !payload.facilityId) {
    payload.facilityId = null;
  }
  return await maintenanceStaffRepository.updateOne(id, companyId, payload);
};

/**
 * Deletes a maintenance staff member.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteStaff = async (id, companyId) => {
  return await maintenanceStaffRepository.deleteOne(id, companyId);
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};
