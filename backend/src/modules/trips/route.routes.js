const express = require('express');
const router = express.Router();
const routeController = require('./controllers/route.controller');
const validate = require('../../middlewares/validate.middleware');
const { createRouteSchema } = require('./validators/route.validator');
const { authenticate, requireRole, logManagerAction } = require('../auth/auth.middleware');

router.use(authenticate);

router.route('/')
  .post(requireRole(['admin']), validate(createRouteSchema), routeController.createRoute)
  .get(requireRole(['admin', 'manager', 'customer']), routeController.getAllRoutes);

router.route('/:id')
  .get(requireRole(['admin', 'manager', 'customer']), routeController.getRouteById)
  .patch(requireRole(['admin', 'manager']), logManagerAction('UPDATE_ROUTE', 'ROUTES'), routeController.updateRoute)
  .delete(requireRole(['admin']), routeController.deleteRoute);

module.exports = router;
