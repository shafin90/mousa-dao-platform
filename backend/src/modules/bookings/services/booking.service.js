const mongoose = require('mongoose');
const bookingRepository = require('../repositories/booking.repository');
const tripRepository = require('../../trips/repositories/trip.repository');
const { validateTripAvailability, checkSeatConflicts, calculateTotalAmount } = require('./booking.validation.service');
const { publishBookingEvent, publishNotificationEvent } = require('./booking.publish.service');
const { holdSeats, releaseHeldSeats } = require('../../../services/seatHold.service');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Queues a booking request (called by API — async only).
 * Validates trip exists, then publishes to queue. The consumer
 * performs full validation and creates the booking.
 *
 * @param {string} userId
 * @param {string} companyId
 * @param {Object} data - { tripId, seats }
 * @returns {Promise<Object>} { eventId }
 */
const createBooking = async (userId, companyId, data) => {
  const trip = await tripRepository.findById(data.tripId, companyId);
  if (!trip) throw new AppError('Trip not found', 404, ErrorCodes.TRIP_NOT_FOUND);

  const held = await holdSeats(data.tripId, data.seats, userId);
  if (!held) throw new AppError('Seats already held by another user', 409, ErrorCodes.BOOKING_CONCURRENT);

  const eventId = await publishBookingEvent({ userId, companyId, tripId: data.tripId, seats: data.seats, passengers: data.passengers || [] });
  return { eventId };
};

/**
 * Processes a booking after it is dequeued.
 * Validates availability, checks seat conflicts, creates the booking
 * record, and increments seatsBooked — all within a transaction.
 *
 * @param {string} userId
 * @param {string} companyId
 * @param {Object} data - { tripId, seats }
 * @returns {Promise<Object>} Created booking
 */
const processBooking = async (userId, companyId, data) => {
  const MAX_RETRIES = 5;
  const seatCount = data.seats.length;

  const trip = await validateTripAvailability(data.tripId, companyId, seatCount);
  const totalAmount = calculateTotalAmount(data.seats, trip.price);

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await checkSeatConflicts(data.tripId, companyId, data.seats, session);

      const booking = await bookingRepository.create(
        { companyId, userId, tripId: data.tripId, seats: data.seats, totalAmount, status: 'pending', passengers: data.passengers || [] },
        session
      );

      await tripRepository.incrementSeats(data.tripId, seatCount, session);
      await session.commitTransaction();
      session.endSession();

      return booking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      const isTransient = error.errorLabels && error.errorLabels.includes('TransientTransactionError');
      if (isTransient && attempt < MAX_RETRIES - 1) {
        attempt++;
        await new Promise((r) => setTimeout(r, 50 * attempt));
        continue;
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Booking failed due to concurrency', 409, ErrorCodes.BOOKING_CONCURRENT);
    }
  }
};

/**
 * Fetches all bookings for a specific user within a company.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getUserBookings = async (userId, companyId, filters = {}) => {
  const query = { userId, companyId };
  if (filters.status) query.status = filters.status;
  if (filters.upcoming === 'true') {
    query.status = { $in: ['pending', 'completed'] };
  }
  const raw = await bookingRepository.findMany(query, filters.page || 1, filters.limit || 20);
  return raw.bookings;
};

/**
 * Fetches paginated bookings for a company with advanced filters.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getAllBookings = async (companyId, filters, page, limit) => {
  return await bookingRepository.findMany({ companyId, ...filters }, page, limit);
};

/**
 * Fetches a single booking by ID within company scope.
 *
 * @param {string} id
 * @param {string} userId
 * @param {string} companyId
 * @param {boolean} isAdmin
 * @returns {Promise<Object|null>}
 */
const getBookingById = async (id, userId, companyId, isAdmin) => {
  if (!isAdmin) {
    const booking = await bookingRepository.findById(id, companyId);
    if (!booking) return null;
    if (!booking.userId.equals(userId)) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
    return booking;
  }
  return await bookingRepository.findById(id, companyId);
};

/**
 * Cancels a booking and releases its seats.
 *
 * FLOW:
 * Step 1: Fetch booking within company scope
 * Step 2: Validate user owns booking or is admin
 * Step 3: Validate booking is in cancellable state
 * Step 4: Update status to cancelled
 * Step 5: Release seats (decrement seatsBooked)
 *
 * @param {string} id
 * @param {string} userId
 * @param {string} companyId
 * @param {boolean} isAdmin
 * @returns {Promise<Object>}
 */
const cancelBooking = async (id, userId, companyId, isAdmin) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await bookingRepository.findById(id, companyId);
    if (!booking) throw new AppError('Booking not found', 404, ErrorCodes.BOOKING_NOT_FOUND);
    if (!isAdmin && !booking.userId.equals(userId)) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
    if (!['pending', 'completed'].includes(booking.status)) throw new AppError('Booking cannot be cancelled', 400, ErrorCodes.BOOKING_CANNOT_CANCEL);

    const updated = await bookingRepository.updateOne(id, companyId, { $set: { status: 'cancelled' } }, session);
    await tripRepository.incrementSeats(booking.tripId, -booking.seats.length, session);
    await session.commitTransaction();
    await publishNotificationEvent('BOOKING_CANCELLED', companyId, id, userId);
    return updated;
  } finally {
    session.endSession();
  }
};

module.exports = { createBooking, processBooking, getUserBookings, getAllBookings, getBookingById, cancelBooking };
