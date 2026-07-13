const express = require('express');
const router = express.Router();
const maintenanceController = require('./controllers/maintenance.controller');
const { authenticate } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/', maintenanceController.getAllRecords);

module.exports = router;
