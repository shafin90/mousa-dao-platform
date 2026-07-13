const express = require('express');
const router = express.Router();
const staffController = require('./controllers/maintenanceStaff.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createStaffSchema, updateStaffSchema } = require('./validators/maintenanceStaff.validator');

router.use(authenticate);

router.get('/', staffController.getAllStaff);
router.post('/', requireRole(['admin']), validate(createStaffSchema), staffController.createStaff);
router.get('/:id', staffController.getStaffById);
router.patch('/:id', requireRole(['admin']), validate(updateStaffSchema), staffController.updateStaff);
router.delete('/:id', requireRole(['admin']), staffController.deleteStaff);

module.exports = router;
