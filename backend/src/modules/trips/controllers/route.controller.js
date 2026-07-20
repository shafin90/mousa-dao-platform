const routeService = require('../services/route.service');
const { respond } = require('../../../utils/response');

/**
 * POST /routes
 */
const createRoute = async (req, res, next) => {
  try {
    const route = await routeService.createRoute(req.user.companyId, req.body, req.user._id);
    respond(res, 201, route, 'Route created');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /routes
 */
const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await routeService.getAllRoutes(req.user.companyId);
    respond(res, 200, routes);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /routes/:id
 */
const getRouteById = async (req, res, next) => {
  try {
    const route = await routeService.getRouteById(req.params.id, req.user.companyId);
    respond(res, 200, route);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /routes/:id
 */
const updateRoute = async (req, res, next) => {
  try {
    const route = await routeService.updateRoute(req.params.id, req.user.companyId, req.body);
    if (!route) return respond(res, 404, null, 'Route not found');
    respond(res, 200, route, 'Route updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /routes/:id
 */
const deleteRoute = async (req, res, next) => {
  try {
    const route = await routeService.deleteRoute(req.params.id, req.user.companyId);
    if (!route) return respond(res, 404, null, 'Route not found');
    respond(res, 200, null, 'Route deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute };
