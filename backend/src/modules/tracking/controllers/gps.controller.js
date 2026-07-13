const gpsService = require('../services/gps.service');
const { respond } = require('../../../utils/response');

/**
 * GET /tracking/live/:tripId
 * Returns the latest GPS location for a specific trip.
 */
const getLiveTripLocation = async (req, res, next) => {
  try {
    const location = await gpsService.getLiveTripLocation(req.params.tripId, req.user.companyId);
    if (!location) return respond(res, 404, null, 'No location data for this trip');
    respond(res, 200, location);
  } catch (error) { next(error); }
};

/**
 * GET /tracking/bus/:busId
 * Returns the latest GPS location for a bus (Redis-first).
 */
const getBusLocation = async (req, res, next) => {
  try {
    const result = await gpsService.getBusLocation(req.params.busId, req.user.companyId);
    respond(res, 200, result.data, `Source: ${result.source}`);
  } catch (error) { next(error); }
};

/**
 * GET /tracking/active-buses
 * Returns all active bus locations for the tenant.
 */
const getActiveBuses = async (req, res, next) => {
  try {
    const locations = await gpsService.getActiveBuses(req.user.companyId);
    respond(res, 200, locations);
  } catch (error) { next(error); }
};

module.exports = { getLiveTripLocation, getBusLocation, getActiveBuses };
