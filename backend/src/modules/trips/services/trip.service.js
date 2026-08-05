const tripRepository = require("../repositories/trip.repository");
const routeRepository = require("../repositories/route.repository");
const busRepository = require("../../fleet/repositories/bus.repository");
const stationRepository = require("../../stations/repositories/station.repository");
const gpsRepository = require("../../tracking/repositories/gps.repository");
const { deleteBusLocation: delBusLocationCache } = require("../../../services/redis/busLocation.service");
const AppError = require("../../../errors/AppError");
const ErrorCodes = require("../../../errors/errorCodes");
const mongoose = require("mongoose");

const defaultPopulate = [
  { path: "busId", select: "busNumber name capacity type photos" },
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
  let distanceKm = 100;
  if (fromS?.location?.lat && toS?.location?.lat) {
    const R = 6371;
    const dLat = ((toS.location.lat - fromS.location.lat) * Math.PI) / 180;
    const dLon = ((toS.location.lng - fromS.location.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((fromS.location.lat * Math.PI) / 180) * Math.cos((toS.location.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    distanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
  const route = await routeRepository.create({
    companyId,
    fromCity: fromCityId,
    toCity: toCityId,
    distanceKm,
    estimatedTimeMinutes: Math.round(distanceKm / 60 * 60),
  });
  return route;
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

const buildTripFilter = (companyId, filters) => {
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
  if (filters.departureTime) {
    const timeStr = String(filters.departureTime).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.departureTime = { $regex: `^${timeStr}` };
  }

  if (filters.priceMin || filters.priceMax) {
    filter.price = {};
    if (filters.priceMin) filter.price.$gte = Number(filters.priceMin);
    if (filters.priceMax) filter.price.$lte = Number(filters.priceMax);
  }

  return filter;
};

const buildAggregationPipeline = async (companyId, filters) => {
  const pipeline = [
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
  ];

  if (filters.date) {
    const d = new Date(filters.date);
    if (!isNaN(d.getTime())) {
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      pipeline.push({ $match: { date: { $gte: start, $lte: end } } });
    }
  }

  if (filters.routeId && mongoose.Types.ObjectId.isValid(filters.routeId)) {
    pipeline.push({ $match: { routeId: new mongoose.Types.ObjectId(filters.routeId) } });
  }
  if (filters.busId && mongoose.Types.ObjectId.isValid(filters.busId)) {
    pipeline.push({ $match: { busId: new mongoose.Types.ObjectId(filters.busId) } });
  }
  if (filters.status) {
    pipeline.push({ $match: { status: filters.status } });
  }
  if (filters.departureTime) {
    const timeStr = String(filters.departureTime).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pipeline.push({ $match: { departureTime: { $regex: `^${timeStr}` } } });
  }
  if (filters.priceMin || filters.priceMax) {
    const priceMatch = {};
    if (filters.priceMin) priceMatch.$gte = Number(filters.priceMin);
    if (filters.priceMax) priceMatch.$lte = Number(filters.priceMax);
    pipeline.push({ $match: { price: priceMatch } });
  }

  const orConditions = [];

  if (filters.country) {
    const countryCities = await mongoose.model('City').find({ companyId, country: filters.country }).select('_id');
    const countryCityIds = countryCities.map((c) => c._id);
    const routes = countryCityIds.length
      ? await routeRepository.findWhere({ companyId, $or: [{ fromCity: { $in: countryCityIds } }, { toCity: { $in: countryCityIds } }] })
      : [];
    pipeline.push({ $match: { routeId: { $in: routes.map((r) => r._id) } } });
  }

  if (filters.fromCountry) {
    const fromCities = await mongoose.model('City').find({ companyId, country: filters.fromCountry }).select('_id');
    const fromCityIds = fromCities.map((c) => c._id);
    const routes = fromCityIds.length
      ? await routeRepository.findWhere({ companyId, fromCity: { $in: fromCityIds } })
      : [];
    pipeline.push({ $match: { routeId: { $in: routes.map((r) => r._id) } } });
  }

  if (filters.toCountry) {
    const toCities = await mongoose.model('City').find({ companyId, country: filters.toCountry }).select('_id');
    const toCityIds = toCities.map((c) => c._id);
    const routes = toCityIds.length
      ? await routeRepository.findWhere({ companyId, toCity: { $in: toCityIds } })
      : [];
    pipeline.push({ $match: { routeId: { $in: routes.map((r) => r._id) } } });
  }

  if (filters.cityId && mongoose.Types.ObjectId.isValid(filters.cityId)) {
    const cityId = new mongoose.Types.ObjectId(filters.cityId);
    pipeline.push(
      { $lookup: { from: 'stations', localField: 'fromStation', foreignField: '_id', as: 'fromStationData' } },
      { $lookup: { from: 'stations', localField: 'toStation', foreignField: '_id', as: 'toStationData' } },
      { $lookup: { from: 'routes', localField: 'routeId', foreignField: '_id', as: 'routeData' } },
      {
        $match: {
          $or: [
            { 'fromStationData.cityId': cityId },
            { 'toStationData.cityId': cityId },
            { 'routeData.fromCity': cityId },
            { 'routeData.toCity': cityId },
            { 'routeData.stops.cityId': cityId },
          ],
        },
      },
    );
  }

  if (filters.fromStation || filters.toStation) {
    const resolveStation = async (value) => {
      if (!value) return null;
      if (mongoose.Types.ObjectId.isValid(value)) {
        return stationRepository.findById(value, companyId);
      }
      const regex = new RegExp(value, 'i');
      const [stations, cities] = await Promise.all([
        stationRepository.search(companyId, regex),
        mongoose.model('City').find({ companyId, name: regex }).select('_id'),
      ]);
      const cityIds = [
        ...new Set([
          ...stations.map((s) => String(s.cityId?._id || s.cityId)).filter(Boolean),
          ...cities.map((c) => String(c._id)),
        ]),
      ];
      return { cityIds };
    };

    const [fromRes, toRes] = await Promise.all([
      resolveStation(filters.fromStation),
      resolveStation(filters.toStation),
    ]);

    const cityOr = [];
    if (fromRes?.cityIds) cityOr.push({ fromCity: { $in: fromRes.cityIds } });
    else if (fromRes) cityOr.push({ fromCity: fromRes.cityId?._id || fromRes.cityId });
    if (toRes?.cityIds) cityOr.push({ toCity: { $in: toRes.cityIds } });
    else if (toRes) cityOr.push({ toCity: toRes.cityId?._id || toRes.cityId });

    if (cityOr.length) {
      const routes = await routeRepository.findWhere({ companyId, $or: cityOr });
      if (routes.length) {
        orConditions.push({ routeId: { $in: routes.map((r) => r._id) } });
      }
    }
  }

  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    const [matchingBuses, matchingStations] = await Promise.all([
      busRepository.search(companyId, regex),
      stationRepository.search(companyId, regex),
    ]);
    const searchOr = [];
    if (matchingBuses.length) searchOr.push({ busId: { $in: matchingBuses.map((b) => b._id) } });
    if (matchingStations.length) {
      const cityIds = [...new Set(matchingStations.map((s) => String(s.cityId?._id || s.cityId)).filter(Boolean))];
      if (cityIds.length) {
        const matchingRouteIds = await routeRepository.findWhere({ companyId, $or: [{ fromCity: { $in: cityIds } }, { toCity: { $in: cityIds } }] });
        if (matchingRouteIds.length) searchOr.push({ routeId: { $in: matchingRouteIds.map((r) => r._id) } });
      }
    }
    if (searchOr.length) orConditions.push(...searchOr);
  }

  if (orConditions.length) {
    pipeline.push({ $match: { $or: orConditions } });
  }

  if (filters.sortBy) {
    const sortField = filters.sortBy === 'duration' ? 'routeId.estimatedTimeMinutes' : filters.sortBy;
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: { [sortField]: sortOrder } });
  } else {
    pipeline.push({ $sort: { date: 1, departureTime: 1 } });
  }

  return pipeline;
};

const getAllTrips = async (companyId, filters, page = 1, limit = 20) => {
  const needsComplexFilter = filters.cityId || filters.fromStation || filters.toStation || filters.search || filters.country || filters.fromCountry || filters.toCountry;

  if (needsComplexFilter) {
    const pipeline = await buildAggregationPipeline(companyId, filters);
    const Trip = require('../models/Trip');
    const facet = await Trip.aggregate([
      ...pipeline,
      {
        $facet: {
          items: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $lookup: { from: 'buses', localField: 'busId', foreignField: '_id', as: 'busId' } },
            { $unwind: { path: '$busId', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'routes',
                localField: 'routeId',
                foreignField: '_id',
                as: 'routeId',
              },
            },
            { $unwind: { path: '$routeId', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'stations', localField: 'fromStation', foreignField: '_id', as: 'fromStation' } },
            { $unwind: { path: '$fromStation', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'stations', localField: 'toStation', foreignField: '_id', as: 'toStation' } },
            { $unwind: { path: '$toStation', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy' } },
            { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                'busId.busNumber': 1, 'busId.name': 1, 'busId.capacity': 1, 'busId.type': 1, 'busId.photos': 1,
                'routeId.fromCity': 1, 'routeId.toCity': 1, 'routeId.distanceKm': 1, 'routeId.estimatedTimeMinutes': 1,
                'fromStation.name': 1, 'toStation.name': 1,
                'createdBy.firstName': 1, 'createdBy.lastName': 1, 'createdBy.email': 1,
                companyId: 1, date: 1, departureTime: 1, arrivalTime: 1, price: 1,
                seatsTotal: 1, seatsBooked: 1, status: 1, delayMinutes: 1,
                actualDepartureTime: 1, actualArrivalTime: 1,
                createdAt: 1, updatedAt: 1,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);
    const items = facet[0]?.items || [];
    const total = facet[0]?.total[0]?.count || 0;
    return { items, total, page, limit };
  }

  const filter = buildTripFilter(companyId, filters);
  const sort = {};
  if (filters.sortBy) {
    sort[filters.sortBy === 'duration' ? 'routeId.estimatedTimeMinutes' : filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.date = 1;
    sort.departureTime = 1;
  }
  return await tripRepository.findMany(filter, { page, limit, populate: defaultPopulate, sort });
};

const getTripById = async (id, companyId) => {
  return await tripRepository.findById(id, companyId, defaultPopulate);
};

const updateTrip = async (id, companyId, data) => {
  const updateData = { ...data };
  delete updateData.seatsBooked;

  const stationsChanged = data.fromStation && data.toStation;
  if (data.busId || stationsChanged) {
    const current = await tripRepository.findById(id, companyId);
    if (!current) throw new AppError("Trip not found", 404, ErrorCodes.TRIP_NOT_FOUND);

    if (data.busId) {
      const currentBusId = current.busId?._id ? String(current.busId._id) : String(current.busId);
      if (currentBusId !== String(data.busId)) {
        const bus = await validateBus(data.busId, companyId);
        updateData.seatsTotal = Math.max(bus.capacity, current.seatsBooked || 0);
        const blockedSeats = data.blockedSeats || current.blockedSeats || [];
        if (blockedSeats.length > bus.capacity) {
          throw new AppError("Blocked seats exceed new bus capacity", 400, ErrorCodes.VALIDATION_ERROR);
        }
      }
    }

    if (stationsChanged) {
      const currentFrom = current.fromStation?._id ? String(current.fromStation._id) : String(current.fromStation);
      const currentTo = current.toStation?._id ? String(current.toStation._id) : String(current.toStation);
      if (currentFrom !== String(data.fromStation) || currentTo !== String(data.toStation)) {
        const route = await findOrCreateRoute(companyId, data.fromStation, data.toStation);
        updateData.routeId = route._id;
      }
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
