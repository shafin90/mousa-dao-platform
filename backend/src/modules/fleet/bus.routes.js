const express = require('express');
const router = express.Router();
const busController = require('./controllers/bus.controller');
const validate = require('../../middlewares/validate.middleware');
const { createBusSchema, updateBusStatusSchema, assignDriverSchema, maintenanceLogSchema } = require('./validators/bus.validator');
const { authenticate, requireRole, logManagerAction } = require('../auth/auth.middleware');

router.use(authenticate);

router.route('/')
  .post(requireRole(['admin']), validate(createBusSchema), busController.createBus)
  .get(requireRole(['admin', 'manager', 'customer']), busController.getAllBuses);

router.route('/:id')
  .get(requireRole(['admin', 'manager', 'customer']), busController.getBusById)
  .patch(requireRole(['admin', 'manager']), logManagerAction('UPDATE_BUS', 'FLEET'), busController.updateBus)
  .delete(requireRole(['admin']), busController.deleteBus);

router.get('/:id/seats', requireRole(['admin', 'manager', 'customer']), busController.getBusSeatLayout);
router.patch('/:id/status', requireRole(['admin']), validate(updateBusStatusSchema), busController.updateBusStatus);
router.patch('/:id/assign-driver', requireRole(['admin']), validate(assignDriverSchema), busController.assignDriver);
router.route('/:id/maintenance')
  .get(requireRole(['admin', 'manager']), busController.getMaintenanceLogs)
  .post(requireRole(['admin']), validate(maintenanceLogSchema), busController.addMaintenanceLog);

module.exports = router;
