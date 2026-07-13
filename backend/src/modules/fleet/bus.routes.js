const express = require('express');
const router = express.Router();
const busController = require('./controllers/bus.controller');
const validate = require('../../middlewares/validate.middleware');
const { createBusSchema, updateBusStatusSchema, assignDriverSchema, maintenanceLogSchema } = require('./validators/bus.validator');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.route('/')
  .post(requireRole(['admin']), validate(createBusSchema), busController.createBus)
  .get(busController.getAllBuses);

router.route('/:id')
  .get(busController.getBusById)
  .patch(requireRole(['admin']), busController.updateBus)
  .delete(requireRole(['admin']), busController.deleteBus);

router.patch('/:id/status', requireRole(['admin']), validate(updateBusStatusSchema), busController.updateBusStatus);
router.patch('/:id/assign-driver', requireRole(['admin']), validate(assignDriverSchema), busController.assignDriver);
router.route('/:id/maintenance')
  .get(busController.getMaintenanceLogs)
  .post(requireRole(['admin']), validate(maintenanceLogSchema), busController.addMaintenanceLog);

module.exports = router;
