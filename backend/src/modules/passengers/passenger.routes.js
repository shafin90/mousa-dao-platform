const express = require('express');
const router = express.Router();
const passengerController = require('./controllers/passenger.controller');
const { authenticate } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/', passengerController.getMyPassengers);
router.post('/', passengerController.addPassenger);
router.patch('/:id', passengerController.updatePassenger);
router.delete('/:id', passengerController.deletePassenger);

module.exports = router;
