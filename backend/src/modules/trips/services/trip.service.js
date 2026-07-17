const tripRepository = require('../repositories/trip.repository');
const routeRepository = require('../repositories/route.repository');
const busRepository = require('../../fleet/repositories/bus.repository');
const stationRepository = require('../../stations/repositories/station.repository');
const gpsRepository = require('../../tracking/repositories/gps.repository');
const { delBusLocationCache } = require('../../../redis/client');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');
const mongoose = require('mongoose');

const defaultPopulate = [
  { path: 'busId', select: 'busNumber name capacity type' },
  {
    path: 'routeId',
    populate: [
      { path: 'fromStation', select: 'name' },
      { path: 'toStation', select: 'name' },
      { path: 'stops.cityId', select: 'name' },
    ],
  },
];

/**
 * Validates that the bus exists and belongs to the company.
 *
 * @param {string} busId
 * @param {string} companyId
 * @returns {Promise<Object>}
 */
const validateBus = async (busId, companyId) => {
  const bus = await busRepository.findById(busId, companyId);
  if (!bus) throw new AppError('Bus not found', 404, ErrorCodes.BUS_NOT_FOUND);
  return bus;
};

/**
 * Creates a new trip with bus capacity pre-filled.
 *
 * FLOW:
 * Step 1: Validate bus exists in company
 * Step 2: Build trip data with bus capacity as seatsTotal
 * Step 3: Persist and return with populated references
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createTrip = async (companyId, data) => {
  const bus = await validateBus(data.busId, companyId);
  const existing = await tripRepository.findMany({
    companyId,
    routeId: data.routeId,
    busId: data.busId,
    date: { $gte: new Date(new Date(data.date).setHours(0, 0, 0, 0)), $lte: new Date(new Date(data.date).setHours(23, 59, 59, 999)) },
    departureTime: data.departureTime,
  });
  if (existing.length > 0) throw new AppError('A trip with this route, bus, date, and departure time already exists', 409, ErrorCodes.TRIP_ALREADY_EXISTS);
  const tripData = { ...data, companyId, seatsTotal: bus.capacity, seatsBooked: 0, status: data.status || 'scheduled' };
  const trip = await tripRepository.create(tripData);
  return await tripRepository.findById(trip._id, companyId, defaultPopulate);
};

/**
 * Builds a MongoDB filter object from query params.
 *
 * @param {string} companyId
 * @param {Object} filters - Raw query params
 * @returns {Promise<Object>} Compiled filter
 */
const buildTripFilter = async (companyId, filters) => {
  const filter = { companyId };

  if (filters.date) {
    const d = new Date(filters.date);
    if (!isNaN(d.getTime())) {
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
  }

  if (filters.routeId && mongoose.Types.ObjectId.isValid(filters.routeId)) filter.routeId = new mongoose.Types.ObjectId(filters.routeId);
  if (filters.busId && mongoose.Types.ObjectId.isValid(filters.busId)) filter.busId = new mongoose.Types.ObjectId(filters.busId);
  if (filters.status) filter.status = filters.status;

  if (filters.priceMin || filters.priceMax) {
    filter.price = {};
    if (filters.priceMin) filter.price.$gte = Number(filters.priceMin);
    if (filters.priceMax) filter.price.$lte = Number(filters.priceMax);
  }

  if (filters.fromStation || filters.toStation) {
    const routeQ = { companyId };
    if (filters.fromStation && mongoose.Types.ObjectId.isValid(filters.fromStation)) routeQ.fromStation = new mongoose.Types.ObjectId(filters.fromStation);
    if (filters.toStation && mongoose.Types.ObjectId.isValid(filters.toStation)) routeQ.toStation = new mongoose.Types.ObjectId(filters.toStation);
    if (Object.keys(routeQ).length > 1) {
      const routes = await routeRepository.findWhere(routeQ);
      filter.routeId = { $in: routes.map((r) => r._id) };
    }
  }

  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    const [matchingBuses, matchingStations] = await Promise.all([
      busRepository.search(companyId, regex),
      stationRepository.search(companyId, regex),
    ]);
    const orClauses = [];
    if (matchingBuses.length) orClauses.push({ busId: { $in: matchingBuses.map((b) => b._id) } });
    if (matchingStations.length) {
      const stationIds = matchingStations.map((s) => s._id);
      const matchingRouteIds = await routeRepository.findWhere({ companyId, $or: [{ fromStation: { $in: stationIds } }, { toStation: { $in: stationIds } }] });
      if (matchingRouteIds.length) orClauses.push({ routeId: { $in: matchingRouteIds.map((r) => r._id) } });
    }
    if (orClauses.length) filter.$or = orClauses;
  }

  return filter;
};

/**
 * Lists trips based on query filters, scoped to company.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getAllTrips = async (companyId, filters) => {
  const filter = await buildTripFilter(companyId, filters);
  return await tripRepository.findMany(filter, defaultPopulate);
};

/**
 * Fetches a single trip by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getTripById = async (id, companyId) => {
  return await tripRepository.findById(id, companyId, defaultPopulate);
};

/**
 * Updates trip details. When the assigned bus changes, seatsTotal is
 * re-derived from the new bus capacity (never dropping below already-booked
 * seats to preserve data integrity).
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateTrip = async (id, companyId, data) => {
  const updateData = { ...data };
  delete updateData.seatsBooked;

  if (data.busId) {
    const current = await tripRepository.findById(id, companyId);
    if (!current) throw new AppError('Trip not found', 404, ErrorCodes.TRIP_NOT_FOUND);
    const currentBusId = current.busId?._id ? String(current.busId._id) : String(current.busId);
    if (currentBusId !== String(data.busId)) {
      const bus = await validateBus(data.busId, companyId);
      updateData.seatsTotal = Math.max(bus.capacity, current.seatsBooked || 0);
    }
  }

  return await tripRepository.updateOne(id, companyId, updateData);
};

/**
 * Updates trip status. Cleans up GPS location when completed.
 *
 * FLOW:
 * Step 1: Update trip status
 * Step 2: If completed → delete GPS location + Redis cache
 *
 * @param {string} id
 * @param {string} companyId
 * @param {string} status
 * @returns {Promise<Object|null>}
 */
const updateTripStatus = async (id, companyId, status) => {
  const trip = await tripRepository.updateOne(id, companyId, { status });
  if (trip && status === 'completed') {
    await gpsRepository.deleteByTrip(id, companyId);
    await delBusLocationCache(companyId, trip.busId);
  }
  return trip;
};

/**
 * Deletes a trip and cleans up GPS tracking.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteTrip = async (id, companyId) => {
  const trip = await tripRepository.findById(id, companyId);
  if (trip) {
    await gpsRepository.deleteByTrip(id, companyId);
    await delBusLocationCache(companyId, trip.busId);
  }
  return await tripRepository.deleteOne(id, companyId);
};

const deleteAllTrips = async (companyId) => {
  const result = await tripRepository.deleteMany(companyId);
  return result.deletedCount;
};

module.exports = { createTrip, getAllTrips, getTripById, updateTrip, updateTripStatus, deleteTrip, deleteAllTrips };
