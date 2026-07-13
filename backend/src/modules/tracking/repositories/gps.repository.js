const BusLocation = require('../models/BusLocation');

/**
 * Upserts the latest bus location (one document per bus).
 *
 * @param {Object} data - { companyId, busId, tripId, latitude, longitude, speed, heading }
 * @returns {Promise<Object>}
 */
const upsertLocation = async (data) => {
  return await BusLocation.findOneAndUpdate(
    { companyId: data.companyId, busId: data.busId },
    { ...data, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

/**
 * Finds location by trip ID.
 *
 * @param {string} tripId
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findByTrip = async (tripId, companyId) => {
  return await BusLocation.findOne({ tripId, companyId });
};

/**
 * Finds location by bus ID.
 *
 * @param {string} busId
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findByBus = async (busId, companyId) => {
  return await BusLocation.findOne({ busId, companyId });
};

/**
 * Finds all locations for active trips within a company.
 *
 * @param {Array<string>} tripIds
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findByTripIds = async (tripIds, companyId) => {
  return await BusLocation.find({ companyId, tripId: { $in: tripIds } });
};

/**
 * Deletes a location record (used when trip completes).
 *
 * @param {string} tripId
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteByTrip = async (tripId, companyId) => {
  return await BusLocation.findOneAndDelete({ tripId, companyId });
};

module.exports = { upsertLocation, findByTrip, findByBus, findByTripIds, deleteByTrip };
