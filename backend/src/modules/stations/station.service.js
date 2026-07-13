const Station = require('./models/Station');
require('./models/City');

const getAllStations = async (companyId) => {
  return await Station.find({ companyId }).populate('cityId', 'name');
};

const getStationById = async (id, companyId) => {
  return await Station.findOne({ _id: id, companyId }).populate('cityId', 'name');
};

const createStation = async (companyId, data) => {
  const station = await Station.create({ ...data, companyId });
  return await Station.findById(station._id).populate('cityId', 'name');
};

const updateStation = async (id, companyId, data) => {
  return await Station.findOneAndUpdate({ _id: id, companyId }, data, { new: true }).populate('cityId', 'name');
};

const deleteStation = async (id, companyId) => {
  return await Station.findOneAndDelete({ _id: id, companyId });
};

const toRad = (deg) => (deg * Math.PI) / 180;

const getDistance = async (fromId, toId, companyId) => {
  const [from, to] = await Promise.all([
    Station.findOne({ _id: fromId, companyId }),
    Station.findOne({ _id: toId, companyId }),
  ]);

  if (!from || !to) throw new Error('Station not found');

  const R = 6371;
  const dLat = toRad(to.location.lat - from.location.lat);
  const dLng = toRad(to.location.lng - from.location.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.location.lat)) *
      Math.cos(toRad(to.location.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  const avgSpeedKmph = 45;
  const estimatedTimeMinutes = Math.round((distanceKm / avgSpeedKmph) * 60);

  return { distanceKm, estimatedTimeMinutes };
};

module.exports = { getAllStations, getStationById, getDistance, createStation, updateStation, deleteStation };
