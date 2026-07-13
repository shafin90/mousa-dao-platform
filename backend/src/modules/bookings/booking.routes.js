const express = require('express');
const router = express.Router();
const bookingController = require('./controllers/booking.controller');
const validate = require('../../middlewares/validate.middleware');
const { createBookingSchema } = require('./validators/booking.validator');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get('/my', bookingController.getUserBookings);
router.get('/', requireRole(['admin']), bookingController.getAllBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
