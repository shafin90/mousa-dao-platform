const express = require('express');
const router = express.Router();
const stationController = require('./controllers/station.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/', stationController.getAllStations);
router.get('/distance', stationController.getDistance);
router.post('/', requireRole(['admin']), stationController.createStation);
router.get('/:id', stationController.getStationById);
router.patch('/:id', requireRole(['admin']), stationController.updateStation);
router.delete('/:id', requireRole(['admin']), stationController.deleteStation);

module.exports = router;
