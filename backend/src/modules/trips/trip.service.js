const mongoose = require('mongoose');
const Trip = require('./models/Trip');
const Route = require('./models/Route');
const Bus = require('../fleet/models/Bus');
const Station = require('../stations/models/Station');
const BusLocation = require('../tracking/models/BusLocation');
const { delBusLocationCache } = require('../../redis/client');

const createTrip = async (companyId, data) => {
  const bus = await Bus.findOne({ _id: data.busId, companyId });
  if (!bus) throw new Error('Bus not found');

  const tripData = {
    ...data,
    companyId,
    seatsTotal: bus.capacity,
    seatsBooked: data.status !== 'cancelled' ? 0 : undefined,
    status: data.status || 'scheduled'
  };

  const trip = await Trip.create(tripData);
  return await Trip.findById(trip._id).populate([
    { path: 'busId', select: 'busNumber name capacity type' },
    { path: 'routeId', populate: [{ path: 'fromStation', select: 'name' }, { path: 'toStation', select: 'name' }] },
  ]);
};

const getAllTrips = async (companyId, filters) => {
  const filter = { companyId };

  if (filters.date) {
    const d = new Date(filters.date);
    if (!isNaN(d.getTime())) {
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }
  }

  if (filters.routeId && mongoose.Types.ObjectId.isValid(filters.routeId)) {
    filter.routeId = new mongoose.Types.ObjectId(filters.routeId);
  }

  if (filters.busId && mongoose.Types.ObjectId.isValid(filters.busId)) {
    filter.busId = new mongoose.Types.ObjectId(filters.busId);
  }

  if (filters.status) {
    filter.status = filters.status;
  }

  if (filters.priceMin || filters.priceMax) {
    filter.price = {};
    if (filters.priceMin) filter.price.$gte = Number(filters.priceMin);
    if (filters.priceMax) filter.price.$lte = Number(filters.priceMax);
  }

  if (filters.fromStation || filters.toStation) {
    const routeQuery = { companyId };
    if (filters.fromStation && mongoose.Types.ObjectId.isValid(filters.fromStation)) {
      routeQuery.fromStation = new mongoose.Types.ObjectId(filters.fromStation);
    }
    if (filters.toStation && mongoose.Types.ObjectId.isValid(filters.toStation)) {
      routeQuery.toStation = new mongoose.Types.ObjectId(filters.toStation);
    }
    if (Object.keys(routeQuery).length) {
      const routes = await Route.find(routeQuery).select('_id');
      filter.routeId = { $in: routes.map(r => r._id) };
    }
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    const [matchingBuses, matchingStations] = await Promise.all([
      Bus.find({ companyId, $or: [{ busNumber: searchRegex }, { name: searchRegex }] }).select('_id'),
      Station.find({ companyId, name: searchRegex }).select('_id'),
    ]);
    const filterOr = [];
    if (matchingBuses.length) {
      filterOr.push({ busId: { $in: matchingBuses.map(b => b._id) } });
    }
    if (matchingStations.length) {
      const stationIds = matchingStations.map(s => s._id);
      const matchingRouteIds = await Route.find({
        companyId,
        $or: [{ fromStation: { $in: stationIds } }, { toStation: { $in: stationIds } }]
      }).select('_id');
      if (matchingRouteIds.length) {
        filterOr.push({ routeId: { $in: matchingRouteIds.map(r => r._id) } });
      }
    }
    if (filterOr.length) filter.$or = filterOr;
  }

  return await Trip.find(filter).populate([
    { path: 'busId', select: 'busNumber name capacity type' },
    { path: 'routeId', populate: [{ path: 'fromStation', select: 'name' }, { path: 'toStation', select: 'name' }] },
  ]);
};

const getTripById = async (id, companyId) => {
  return await Trip.findOne({ _id: id, companyId }).populate([
    { path: 'busId', select: 'busNumber name capacity type' },
    { path: 'routeId', populate: [{ path: 'fromStation', select: 'name' }, { path: 'toStation', select: 'name' }] },
  ]);
};

const updateTrip = async (id, companyId, data) => {
  return await Trip.findOneAndUpdate({ _id: id, companyId }, data, { new: true }).populate([
    { path: 'busId', select: 'busNumber name capacity type' },
    { path: 'routeId', populate: [{ path: 'fromStation', select: 'name' }, { path: 'toStation', select: 'name' }] },
  ]);
};

const updateTripStatus = async (id, companyId, status) => {
  const trip = await Trip.findOneAndUpdate({ _id: id, companyId }, { status }, { new: true });
  
  if (trip && status === 'completed') {
    await BusLocation.findOneAndDelete({ tripId: id, companyId });
    await delBusLocationCache(companyId, trip.busId);
  }
  
  return trip;
};

const deleteTrip = async (id, companyId) => {
  const trip = await Trip.findOne({ _id: id, companyId });
  if (trip) {
    await BusLocation.findOneAndDelete({ tripId: id, companyId });
    await delBusLocationCache(companyId, trip.busId);
  }
  return await Trip.findOneAndDelete({ _id: id, companyId });
};

module.exports = { createTrip, getAllTrips, getTripById, updateTrip, updateTripStatus, deleteTrip };
