const express = require('express');
const router = express.Router();
const scheduleController = require('./controllers/maintenanceSchedule.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createScheduleSchema, updateScheduleSchema } = require('./validators/maintenanceSchedule.validator');

router.use(authenticate);

router.get('/', scheduleController.getAllSchedules);
router.post('/', requireRole(['admin']), validate(createScheduleSchema), scheduleController.createSchedule);
router.get('/:id', scheduleController.getScheduleById);
router.patch('/:id', requireRole(['admin']), validate(updateScheduleSchema), scheduleController.updateSchedule);
router.delete('/:id', requireRole(['admin']), scheduleController.deleteSchedule);

module.exports = router;
