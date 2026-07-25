const express = require('express');
const router = express.Router();
const stationController = require('./controllers/station.controller');
const { authenticate, requireRole, logManagerAction } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/', requireRole(['admin', 'manager']), stationController.getAllStations);
router.get('/distance', requireRole(['admin', 'manager']), stationController.getDistance);
router.post('/', requireRole(['admin']), stationController.createStation);
router.get('/:id', requireRole(['admin', 'manager']), stationController.getStationById);
router.patch('/:id', requireRole(['admin', 'manager']), logManagerAction('UPDATE_STATION', 'STATIONS'), stationController.updateStation);
router.delete('/:id', requireRole(['admin']), stationController.deleteStation);

module.exports = router;
