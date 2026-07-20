const tripService = require('../services/trip.service');
const { respond } = require('../../../utils/response');

/**
 * POST /trips
 */
const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.user.companyId, req.body, req.user._id);
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
    const trips = await tripService.getAllTrips(req.user.companyId, req.query);
    respond(res, 200, trips);
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
