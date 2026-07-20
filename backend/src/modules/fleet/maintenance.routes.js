const express = require('express');
const router = express.Router();
const maintenanceController = require('./controllers/maintenance.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createMaintenanceSchema, updateMaintenanceSchema } = require('./validators/maintenance.validator');

router.use(authenticate);

router.get('/', maintenanceController.getAllRecords);
router.post('/', requireRole(['admin']), validate(createMaintenanceSchema), maintenanceController.createRecord);
router.get('/:id', maintenanceController.getRecordById);
router.patch('/:id', requireRole(['admin']), validate(updateMaintenanceSchema), maintenanceController.updateRecord);
router.delete('/:id', requireRole(['admin']), maintenanceController.deleteRecord);

module.exports = router;
