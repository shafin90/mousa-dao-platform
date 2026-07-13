const routeService = require('./route.service');

const createRoute = async (req, res) => {
  try {
    const route = await routeService.createRoute(req.user.companyId, req.body);
    res.status(201).json({ success: true, message: 'Route created', data: route });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllRoutes = async (req, res) => {
  try {
    const routes = await routeService.getAllRoutes(req.user.companyId);
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRouteById = async (req, res) => {
  try {
    const route = await routeService.getRouteById(req.params.id, req.user.companyId);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateRoute = async (req, res) => {
  try {
    const route = await routeService.updateRoute(req.params.id, req.user.companyId, req.body);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route updated', data: route });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const route = await routeService.deleteRoute(req.params.id, req.user.companyId);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute };
