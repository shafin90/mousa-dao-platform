const Route = require('./models/Route');

const createRoute = async (companyId, data) => {
  const route = await Route.create({ ...data, companyId });
  return await Route.findById(route._id).populate('fromCity toCity').populate({ path: 'stops.cityId', select: 'name' });
};

const getAllRoutes = async (companyId) => {
  return await Route.find({ companyId }).populate('fromCity toCity').populate({ path: 'stops.cityId', select: 'name' });
};

const getRouteById = async (id, companyId) => {
  return await Route.findOne({ _id: id, companyId }).populate('fromCity toCity').populate({ path: 'stops.cityId', select: 'name' });
};

const updateRoute = async (id, companyId, data) => {
  return await Route.findOneAndUpdate({ _id: id, companyId }, data, { new: true }).populate('fromCity toCity').populate({ path: 'stops.cityId', select: 'name' });
};

const deleteRoute = async (id, companyId) => {
  return await Route.findOneAndDelete({ _id: id, companyId });
};

module.exports = { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute };
