const maintenanceFacilityRepository = require('../repositories/maintenanceFacility.repository');
const Maintenance = require('../models/Maintenance');

/**
 * Lists all maintenance facilities for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getAllFacilities = async (companyId) => {
  return await maintenanceFacilityRepository.findAll(companyId);
};

/**
 * Fetches a single maintenance facility by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getFacilityById = async (id, companyId) => {
  return await maintenanceFacilityRepository.findById(id, companyId);
};

/**
 * Creates a maintenance facility.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createFacility = async (companyId, data) => {
  return await maintenanceFacilityRepository.create({ ...data, companyId });
};

/**
 * Updates a maintenance facility.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateFacility = async (id, companyId, data) => {
  return await maintenanceFacilityRepository.updateOne(id, companyId, data);
};

/**
 * Deletes a maintenance facility and detaches it from any maintenance records.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteFacility = async (id, companyId) => {
  const facility = await maintenanceFacilityRepository.deleteOne(id, companyId);
  if (facility) {
    await Maintenance.updateMany({ companyId, facilityId: id }, { $unset: { facilityId: '' } });
  }
  return facility;
};

/**
 * Lists maintenance records performed at a facility (most recent first).
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getFacilityMaintenance = async (id, companyId) => {
  return await Maintenance.find({ companyId, facilityId: id })
    .populate('busId', 'busNumber name')
    .sort({ date: -1 });
};

module.exports = {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  getFacilityMaintenance,
};
