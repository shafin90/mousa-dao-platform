const express = require('express');
const router = express.Router();
const facilityController = require('./controllers/maintenanceFacility.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createFacilitySchema, updateFacilitySchema } = require('./validators/maintenanceFacility.validator');

router.use(authenticate);

router.get('/', facilityController.getAllFacilities);
router.post('/', requireRole(['admin']), validate(createFacilitySchema), facilityController.createFacility);
router.get('/:id', facilityController.getFacilityById);
router.get('/:id/maintenance', facilityController.getFacilityMaintenance);
router.patch('/:id', requireRole(['admin']), validate(updateFacilitySchema), facilityController.updateFacility);
router.delete('/:id', requireRole(['admin']), facilityController.deleteFacility);

module.exports = router;
