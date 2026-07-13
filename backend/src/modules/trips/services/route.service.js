const routeRepository = require('../repositories/route.repository');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

const routePopulate = [{ path: 'fromStation' }, { path: 'toStation' }];

/**
 * Creates a new route for a company.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createRoute = async (companyId, data) => {
  const route = await routeRepository.create({ ...data, companyId });
  return await routeRepository.findById(route._id, companyId);
};

/**
 * Lists all routes for a company.
 *
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getAllRoutes = async (companyId) => {
  return await routeRepository.findAll(companyId);
};

/**
 * Fetches a single route by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getRouteById = async (id, companyId) => {
  const route = await routeRepository.findById(id, companyId);
  if (!route) throw new AppError('Route not found', 404, ErrorCodes.ROUTE_NOT_FOUND);
  return route;
};

/**
 * Updates a route.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateRoute = async (id, companyId, data) => {
  return await routeRepository.updateOne(id, companyId, data);
};

/**
 * Deletes a route.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteRoute = async (id, companyId) => {
  return await routeRepository.deleteOne(id, companyId);
};

module.exports = { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute };
