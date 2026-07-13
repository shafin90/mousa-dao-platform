const bookingService = require('../services/booking.service');
const { respond, respondPaginated } = require('../../../utils/response');

/**
 * POST /bookings
 * Initiates a booking request (async via queue).
 */
const createBooking = async (req, res, next) => {
  try {
    const result = await bookingService.createBooking(req.user._id, req.user.companyId, req.body);
    respond(res, 202, result, 'Booking request queued');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/my
 * Returns the current user's bookings.
 */
const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user._id, req.user.companyId);
    respond(res, 200, bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings
 * Returns paginated bookings (admin only).
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await bookingService.getAllBookings(req.user.companyId, filters, Number(page) || 1, Number(limit) || 10);
    respondPaginated(res, data.bookings, data.total, Number(page) || 1, Number(limit) || 10);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/:id
 * Returns a single booking by ID.
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user._id, req.user.companyId, req.user.role === 'admin');
    if (!booking) return respond(res, 404, null, 'Booking not found');
    respond(res, 200, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /bookings/:id/cancel
 * Cancels a booking and releases seats.
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user._id, req.user.companyId, req.user.role === 'admin');
    respond(res, 200, booking, 'Booking cancelled');
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getUserBookings, getAllBookings, getBookingById, cancelBooking };
