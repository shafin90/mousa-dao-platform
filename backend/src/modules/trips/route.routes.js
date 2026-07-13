const express = require('express');
const router = express.Router();
const routeController = require('./controllers/route.controller');
const validate = require('../../middlewares/validate.middleware');
const { createRouteSchema } = require('./validators/route.validator');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.route('/')
  .post(requireRole(['admin']), validate(createRouteSchema), routeController.createRoute)
  .get(routeController.getAllRoutes);

router.route('/:id')
  .get(routeController.getRouteById)
  .patch(requireRole(['admin']), routeController.updateRoute)
  .delete(requireRole(['admin']), routeController.deleteRoute);

module.exports = router;
