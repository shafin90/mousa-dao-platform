const gpsRepository = require('../repositories/gps.repository');
const busRepository = require('../../fleet/repositories/bus.repository');
const tripRepository = require('../../trips/repositories/trip.repository');
const busLocationService = require('../../../services/redis/busLocation.service');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * ──────────────────────────────────────────────
 * GPS Service Layer
 * ──────────────────────────────────────────────
 *
 * DATA FLOW:
 *   WRITE path  (socket handler)  → busLocationService.setBusLocation()   → Redis (fast)
 *   READ  path  (REST endpoints)  → busLocationService.get*()             → Redis (fast)
 *                                    ↓ if miss
 *                                    gpsRepository.find*()                → MongoDB (slow fallback)
 *
 * Redis is the source of truth for live positions.
 * MongoDB stores historical records and acts as a fallback for cache misses.
 */

/**
 * Validates a GPS update event.
 *
 * FLOW:
 * Step 1: Check bus exists and belongs to company
 * Step 2: Check trip exists, belongs to company, and matches bus
 * Step 3: Check trip is active (in-progress)
 *
 * @param {string} companyId
 * @param {string} busId
 * @param {string} tripId
 * @returns {Promise<Object>} { bus, trip }
 */
const validateGpsUpdate = async (companyId, busId, tripId) => {
  if (!busId || !tripId)
    throw new AppError(
      'Missing busId or tripId',
      400,
      ErrorCodes.GPS_MISSING_FIELDS,
    );

  const bus = await busRepository.findById(busId, companyId);
  if (!bus)
    throw new AppError(
      'Bus not found for this company',
      404,
      ErrorCodes.BUS_NOT_FOUND,
    );

  const trip = await tripRepository.findById(tripId, companyId);
  if (!trip)
    throw new AppError('Trip not found', 404, ErrorCodes.TRIP_NOT_FOUND);
  if (trip.busId.toString() !== busId)
    throw new AppError(
      'Bus does not match trip',
      400,
      ErrorCodes.GPS_BUS_MISMATCH,
    );
  if (trip.status !== 'active')
    throw new AppError(
      'Trip is not active',
      400,
      ErrorCodes.GPS_TRIP_NOT_ACTIVE,
    );

  return { bus, trip };
};

/**
 * Processes and stores a GPS location update.
 * Writes to MongoDB (for historical record) and Redis (for live tracking).
 *
 * NOTE: The socket hot-path no longer calls this function.
 * This is retained for batch/async historical logging if needed.
 *
 * @param {Object} locationData - { companyId, busId, tripId, latitude, longitude, speed, heading }
 * @returns {Promise<Object>}
 */
const processGpsUpdate = async (locationData) => {
  const record = await gpsRepository.upsertLocation(locationData);
  await busLocationService.setBusLocation(
    locationData.companyId,
    locationData.busId,
    locationData,
  );
  return record;
};

/**
 * Retrieves the latest GPS location for a trip.
 *
 * @param {string} tripId
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getLiveTripLocation = async (tripId, companyId) => {
  return await gpsRepository.findByTrip(tripId, companyId);
};

/**
 * Retrieves the latest GPS location for a bus (Redis-first).
 *
 * FLOW:
 * 1. Query Redis via busLocationService
 * 2. If miss, fall back to MongoDB
 *
 * @param {string} busId
 * @param {string} companyId
 * @returns {Promise<{ data: Object, source: string }>}
 */
const getBusLocation = async (busId, companyId) => {
  const cached = await busLocationService.getBusLocation(companyId, busId);
  if (cached) return { data: cached, source: 'redis' };

  const location = await gpsRepository.findByBus(busId, companyId);
  if (!location)
    throw new AppError(
      'No location data for this bus',
      404,
      ErrorCodes.NOT_FOUND,
    );
  return { data: location, source: 'mongodb' };
};

/**
 * Lists all active bus locations for a company.
 *
 * FLOW:
 * 1. Get active trips from MongoDB (infrequent query)
 * 2. Extract bus IDs from active trips
 * 3. Batch-fetch locations from Redis via pipeline
 * 4. Fall back to MongoDB for any missing buses
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getActiveBuses = async (companyId) => {
  const activeTrips = await tripRepository.findMany({
    companyId,
    status: 'active',
  });
  const tripIds = activeTrips.map((t) => t._id);

  // Try Redis batch read first
  const busIds = activeTrips.map((t) => t.busId);
  const redisLocations =
    await busLocationService.getMultipleBusLocations(companyId, busIds);

  if (redisLocations.length > 0) {
    // Merge Redis results with those from MongoDB to fill gaps
    const locatedBusIds = new Set(redisLocations.map((l) => l.busId));
    const missingBusIds = busIds.filter((id) => !locatedBusIds.has(id));

    let mongoLocations = [];
    if (missingBusIds.length > 0) {
      mongoLocations = await gpsRepository.findByTripIds(tripIds, companyId);
    }

    return [...redisLocations, ...mongoLocations];
  }

  // Complete Redis miss — fall back to MongoDB entirely
  const locations = await gpsRepository.findByTripIds(tripIds, companyId);
  return locations;
};

module.exports = {
  validateGpsUpdate,
  processGpsUpdate,
  getLiveTripLocation,
  getBusLocation,
  getActiveBuses,
};
