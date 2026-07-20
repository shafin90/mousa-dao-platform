const stationRepository = require('../repositories/station.repository');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Lists all stations for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getAllStations = async (companyId) => {
  return await stationRepository.findAll(companyId);
};

/**
 * Fetches a single station by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getStationById = async (id, companyId) => {
  const station = await stationRepository.findById(id, companyId);
  if (!station) throw new AppError('Station not found', 404, ErrorCodes.STATION_NOT_FOUND);
  return station;
};

/**
 * Creates a station.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createStation = async (companyId, data, userId) => {
  const existing = await stationRepository.findAll(companyId);
  const dup = existing.find(
    (s) => s.name.toLowerCase() === data.name?.toLowerCase() && String(s.cityId?._id || s.cityId) === String(data.cityId)
  );
  if (dup) throw new AppError('A station with this name already exists in the selected city', 409, ErrorCodes.STATION_ALREADY_EXISTS);
  return await stationRepository.create({ ...data, companyId, createdBy: userId });
};

/**
 * Updates a station.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateStation = async (id, companyId, data) => {
  return await stationRepository.updateOne(id, companyId, data);
};

/**
 * Deletes a station.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteStation = async (id, companyId) => {
  return await stationRepository.deleteOne(id, companyId);
};

/**
 * Converts degrees to radians.
 *
 * @param {number} deg
 * @returns {number}
 */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Calculates distance between two stations using Haversine formula.
 *
 * FLOW:
 * Step 1: Fetch both stations within company
 * Step 2: Apply Haversine formula
 * Step 3: Estimate travel time at avg 45 km/h
 *
 * @param {string} fromId
 * @param {string} toId
 * @param {string} companyId
 * @returns {Promise<{distanceKm: number, estimatedTimeMinutes: number}>}
 */
const getDistance = async (fromId, toId, companyId) => {
  const [from, to] = await Promise.all([
    stationRepository.findById(fromId, companyId),
    stationRepository.findById(toId, companyId),
  ]);
  if (!from || !to) throw new AppError('Station not found', 404, ErrorCodes.STATION_NOT_FOUND);

  const R = 6371;
  const dLat = toRad(to.location.lat - from.location.lat);
  const dLng = toRad(to.location.lng - from.location.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.location.lat)) * Math.cos(toRad(to.location.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);
  const estimatedTimeMinutes = Math.round((distanceKm / 45) * 60);

  return { distanceKm, estimatedTimeMinutes };
};

module.exports = { getAllStations, getStationById, createStation, updateStation, deleteStation, getDistance };
