const express = require('express');
const router = express.Router();
const dashboardController = require('./controllers/maintenanceDashboard.controller');
const { authenticate } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/', dashboardController.getOverview);

module.exports = router;
