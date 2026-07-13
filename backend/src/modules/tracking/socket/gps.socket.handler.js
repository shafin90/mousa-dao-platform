const gpsService = require('../services/gps.service');
const busLocationService = require('../../../services/redis/busLocation.service');
const { emitToCompany } = require('../../../socket/index');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Handles an incoming GPS update from a driver/staff socket.
 *
 * FLOW:
 * Step 1: Validate socket role (driver or staff only)
 * Step 2: Validate GPS fields (busId, tripId, lat, lng)
 * Step 3: Validate bus + trip exist and trip is active
 * Step 4: Write to Redis (primary fast store) — no MongoDB on hot path
 * Step 5: Join trip:{tripId} room for targeted subscribers
 * Step 6: Emit gps:live to company:{companyId} room
 *
 * RATIONAL:
 * - Redis is the source of truth for live positions (sub-ms reads/writes)
 * - MongoDB is NOT written on every GPS tick (avoids write amplification)
 * - Historical GPS data is handled by a separate batch pipeline if needed
 * - In-memory fallback activates if Redis is unavailable (no crash)
 *
 * INPUT:
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} data - { busId, tripId, latitude, longitude, speed, heading }
 *
 * OUTPUT:
 * @returns {Promise<void>}
 *
 * SIDE EFFECTS:
 * - Writes to Redis (key: bus:{companyId}:{busId})
 * - Adds socket to trip:{tripId} room
 * - Emits gps:live to company:{companyId} and trip:{tripId} rooms
 */
const handleGpsUpdate = async (socket, data) => {
  // Step 1: Validate role — only drivers/staff can push GPS
  if (!['driver', 'staff'].includes(socket.role)) {
    throw new AppError(
      'Only drivers and staff can send GPS data',
      403,
      ErrorCodes.GPS_UNAUTHORIZED_ROLE,
    );
  }

  // Step 2: Validate required fields
  const { busId, tripId, latitude, longitude, speed, heading } = data;
  if (!busId || !tripId || latitude == null || longitude == null) {
    throw new AppError(
      'Missing required GPS fields',
      400,
      ErrorCodes.GPS_MISSING_FIELDS,
    );
  }

  // Step 3: Validate bus ownership + trip is active
  await gpsService.validateGpsUpdate(socket.companyId, busId, tripId);

  const now = new Date().toISOString();

  const locationData = {
    companyId: socket.companyId,
    busId,
    tripId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    updatedAt: now,
  };

  // Step 4: Write to Redis (the primary real-time data store)
  // Falls back to in-memory Map if Redis is unavailable
  await busLocationService.setBusLocation(
    socket.companyId,
    busId,
    locationData,
  );

  // Step 5: Subscribe socket to trip-scoped room
  socket.join(`trip:${tripId}`);

  // Step 6: Broadcast to company room (frontends consume this event)
  emitToCompany(socket.companyId, 'gps:live', {
    companyId: socket.companyId,
    busId,
    tripId,
    latitude,
    longitude,
    speed: speed || 0,
    heading: heading || 0,
    updatedAt: now,
  });
};

module.exports = { handleGpsUpdate };
