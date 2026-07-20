const tripRepository = require("../repositories/trip.repository");
const routeRepository = require("../repositories/route.repository");
const busRepository = require("../../fleet/repositories/bus.repository");
const stationRepository = require("../../stations/repositories/station.repository");
const gpsRepository = require("../../tracking/repositories/gps.repository");
const { delBusLocationCache } = require("../../../redis/client");
const AppError = require("../../../errors/AppError");
const ErrorCodes = require("../../../errors/errorCodes");
const mongoose = require("mongoose");

const defaultPopulate = [
  { path: "busId", select: "busNumber name capacity type" },
  {
    path: "routeId",
    populate: [
      { path: "fromCity", select: "name" },
      { path: "toCity", select: "name" },
      { path: "fromStations", select: "name" },
      { path: "toStations", select: "name" },
      { path: "stops.cityId", select: "name" },
      { path: "stops.stationId", select: "name" },
    ],
  },
  { path: "fromStation", select: "name" },
  { path: "toStation", select: "name" },
  { path: "createdBy", select: "firstName lastName email" },
];

const findOrCreateRoute = async (companyId, fromStationId, toStationId) => {
  const [fromS, toS] = await Promise.all([
    stationRepository.findById(fromStationId, companyId),
    stationRepository.findById(toStationId, companyId),
  ]);
  const fromCityId = fromS?.cityId?._id || fromS?.cityId;
  const toCityId = toS?.cityId?._id || toS?.cityId;
  let routes = await routeRepository.findWhere({ companyId, fromCity: fromCityId, toCity: toCityId });
  if (routes.length === 0) {
    let distanceKm = 100;
    if (fromS?.location?.lat && toS?.location?.lat) {
      const R = 6371;
      const dLat = ((toS.location.lat - fromS.location.lat) * Math.PI) / 180;
      const dLon = ((toS.location.lng - fromS.location.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((fromS.location.lat * Math.PI) / 180) * Math.cos((toS.location.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      distanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }
    routes = [await routeRepository.create({
      companyId,
      fromCity: fromCityId,
      toCity: toCityId,
      distanceKm,
      estimatedTimeMinutes: Math.round(distanceKm / 60 * 60),
    })];
  }
  return routes[0];
};

const validateBus = async (busId, companyId) => {
  const bus = await busRepository.findById(busId, companyId);
  if (!bus) throw new AppError("Bus not found", 404, ErrorCodes.BUS_NOT_FOUND);
  return bus;
};

const createTrip = async (companyId, data, createdBy) => {
  const bus = await validateBus(data.busId, companyId);
  const route = await findOrCreateRoute(companyId, data.fromStation, data.toStation);
  const tripData = {
    ...data,
    companyId,
    routeId: route._id,
    seatsTotal: bus.capacity,
    seatsBooked: 0,
    status: data.status || "scheduled",
    createdBy,
  };
  const trip = await tripRepository.create(tripData);
  return await tripRepository.findById(trip._id, companyId, defaultPopulate);
};

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
    if (filters.fromStation && mongoose.Types.ObjectId.isValid(filters.fromStation)) {
      const station = await stationRepository.findById(filters.fromStation);
      if (station) routeQ.fromCity = new mongoose.Types.ObjectId(station.cityId?._id || station.cityId);
    }
    if (filters.toStation && mongoose.Types.ObjectId.isValid(filters.toStation)) {
      const station = await stationRepository.findById(filters.toStation);
      if (station) routeQ.toCity = new mongoose.Types.ObjectId(station.cityId?._id || station.cityId);
    }
    if (Object.keys(routeQ).length > 1) {
      const routes = await routeRepository.findWhere(routeQ);
      filter.routeId = { $in: routes.map((r) => r._id) };
    }
  }

  if (filters.search) {
    const regex = new RegExp(filters.search, "i");
    const [matchingBuses, matchingStations] = await Promise.all([
      busRepository.search(companyId, regex),
      stationRepository.search(companyId, regex),
    ]);
    const orClauses = [];
    if (matchingBuses.length) orClauses.push({ busId: { $in: matchingBuses.map((b) => b._id) } });
    if (matchingStations.length) {
      const cityIds = [...new Set(matchingStations.map((s) => String(s.cityId?._id || s.cityId)).filter(Boolean))];
      if (cityIds.length) {
        const matchingRouteIds = await routeRepository.findWhere({ companyId, $or: [{ fromCity: { $in: cityIds } }, { toCity: { $in: cityIds } }] });
        if (matchingRouteIds.length) orClauses.push({ routeId: { $in: matchingRouteIds.map((r) => r._id) } });
      }
    }
    if (orClauses.length) filter.$or = orClauses;
  }

  return filter;
};

const getAllTrips = async (companyId, filters) => {
  const filter = await buildTripFilter(companyId, filters);
  return await tripRepository.findMany(filter, defaultPopulate);
};

const getTripById = async (id, companyId) => {
  return await tripRepository.findById(id, companyId, defaultPopulate);
};

const updateTrip = async (id, companyId, data) => {
  const updateData = { ...data };
  delete updateData.seatsBooked;

  if (data.busId) {
    const current = await tripRepository.findById(id, companyId);
    if (!current) throw new AppError("Trip not found", 404, ErrorCodes.TRIP_NOT_FOUND);
    const currentBusId = current.busId?._id ? String(current.busId._id) : String(current.busId);
    if (currentBusId !== String(data.busId)) {
      const bus = await validateBus(data.busId, companyId);
      updateData.seatsTotal = Math.max(bus.capacity, current.seatsBooked || 0);
    }
  }

  return await tripRepository.updateOne(id, companyId, updateData);
};

const updateTripStatus = async (id, companyId, status) => {
  const trip = await tripRepository.updateOne(id, companyId, { status });
  if (trip && status === "completed") {
    await gpsRepository.deleteByTrip(id, companyId);
    await delBusLocationCache(companyId, trip.busId);
  }
  return trip;
};

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
