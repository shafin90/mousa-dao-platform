const express = require('express');
const router = express.Router();
const tripController = require('./controllers/trip.controller');
const validate = require('../../middlewares/validate.middleware');
const { createTripSchema, updateStatusSchema } = require('./validators/trip.validator');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.route('/')
  .post(requireRole(['admin', 'staff']), validate(createTripSchema), tripController.createTrip)
  .get(tripController.getAllTrips);

router.route('/:id')
  .get(tripController.getTripById)
  .patch(requireRole(['admin', 'staff']), tripController.updateTrip)
  .delete(requireRole(['admin']), tripController.deleteTrip);

router.patch('/:id/status', requireRole(['admin', 'staff']), validate(updateStatusSchema), tripController.updateTripStatus);

module.exports = router;
