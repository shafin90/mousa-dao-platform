const Route = require('./models/Route');
require('../stations/models/Station');

const createRoute = async (companyId, data) => {
  const route = await Route.create({ ...data, companyId });
  return await Route.findById(route._id).populate('fromStation toStation');
};

const getAllRoutes = async (companyId) => {
  return await Route.find({ companyId }).populate('fromStation toStation');
};

const getRouteById = async (id, companyId) => {
  return await Route.findOne({ _id: id, companyId }).populate('fromStation toStation');
};

const updateRoute = async (id, companyId, data) => {
  return await Route.findOneAndUpdate({ _id: id, companyId }, data, { new: true }).populate('fromStation toStation');
};

const deleteRoute = async (id, companyId) => {
  return await Route.findOneAndDelete({ _id: id, companyId });
};

module.exports = { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute };
