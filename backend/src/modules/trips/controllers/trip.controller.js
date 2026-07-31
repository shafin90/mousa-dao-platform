const tripService = require('../services/trip.service');
const { respond, respondPaginated } = require('../../../utils/response');
const { notifyAllCustomers } = require('../../notifications/services/notification.service');

/**
 * POST /trips
 */
const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.user.companyId, req.body, req.user._id);
    const fromName = trip.fromCity?.name || req.body.fromCity || '';
    const toName = trip.toCity?.name || req.body.toCity || '';
    notifyAllCustomers({
      companyId: req.user.companyId,
      type: 'trip_update',
      title: 'Nouveau trajet',
      message: `Un nouveau trajet est disponible : ${fromName} → ${toName}`,
      data: { tripId: trip._id },
    }).catch(() => {});
    respond(res, 201, trip, 'Trip created');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /trips
 */
const getAllTrips = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const result = await tripService.getAllTrips(req.user.companyId, req.query, page, limit);
    if (result.items) {
      respondPaginated(res, result.items, result.total, result.page, result.limit);
    } else {
      respond(res, 200, result);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /trips/:id
 */
const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user.companyId);
    if (!trip) return respond(res, 404, null, 'Trip not found');
    respond(res, 200, trip);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /trips/:id/status
 */
const updateTripStatus = async (req, res, next) => {
  try {
    const trip = await tripService.updateTripStatus(req.params.id, req.user.companyId, req.body.status);
    if (!trip) return respond(res, 404, null, 'Trip not found');
    notifyAllCustomers({
      companyId: req.user.companyId,
      type: 'trip_update',
      title: 'Statut du trajet mis à jour',
      message: `Le trajet est maintenant ${req.body.status}`,
      data: { tripId: trip._id },
    }).catch(() => {});
    respond(res, 200, trip, 'Status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /trips/:id
 */
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await tripService.deleteTrip(req.params.id, req.user.companyId);
    if (!trip) return respond(res, 404, null, 'Trip not found');
    respond(res, 200, null, 'Trip deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /trips/:id
 */
const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user.companyId, req.body);
    if (!trip) return respond(res, 404, null, 'Trip not found');
    const fromName = trip.fromCity?.name || '';
    const toName = trip.toCity?.name || '';
    notifyAllCustomers({
      companyId: req.user.companyId,
      type: 'trip_update',
      title: 'Trajet mis à jour',
      message: `Le trajet ${fromName} → ${toName} a été mis à jour`,
      data: { tripId: trip._id },
    }).catch(() => {});
    respond(res, 200, trip, 'Trip updated');
  } catch (error) {
    next(error);
  }
};

const deleteAllTrips = async (req, res, next) => {
  try {
    const count = await tripService.deleteAllTrips(req.user.companyId);
    respond(res, 200, { deletedCount: count }, `${count} trip(s) deleted`);
  } catch (error) {
    next(error);
  }
};

module.exports = { createTrip, getAllTrips, getTripById, updateTrip, updateTripStatus, deleteTrip, deleteAllTrips };
