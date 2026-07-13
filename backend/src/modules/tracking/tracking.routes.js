const express = require('express');
const router = express.Router();
const gpsController = require('./controllers/gps.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/live/:tripId', requireRole(['admin']), gpsController.getLiveTripLocation);
router.get('/bus/:busId', requireRole(['admin']), gpsController.getBusLocation);
router.get('/active-buses', requireRole(['admin']), gpsController.getActiveBuses);

module.exports = router;
