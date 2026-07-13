const Maintenance = require('../models/Maintenance');

/**
 * Lists all maintenance records for a company (newest first), with optional filters.
 *
 * @param {string} companyId
 * @param {Object} filters - Optional { busId, facilityId, type }
 * @returns {Promise<Array>}
 */
const getAllRecords = async (companyId, filters = {}) => {
  const query = { companyId };
  if (filters.busId) query.busId = filters.busId;
  if (filters.facilityId) query.facilityId = filters.facilityId;
  if (filters.type) query.type = filters.type;
  return await Maintenance.find(query)
    .populate('busId', 'busNumber name')
    .populate('facilityId', 'name')
    .sort({ date: -1 });
};

module.exports = { getAllRecords };
