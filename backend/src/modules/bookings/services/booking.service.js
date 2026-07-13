const mongoose = require('mongoose');
const bookingRepository = require('../repositories/booking.repository');
const tripRepository = require('../../trips/repositories/trip.repository');
const { validateTripAvailability, checkSeatConflicts, calculateTotalAmount } = require('./booking.validation.service');
const { publishBookingEvent } = require('./booking.publish.service');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Orchestrates the full booking creation flow.
 *
 * FLOW:
 * Step 1: Validate trip exists, is scheduled, and has capacity
 * Step 2: Check requested seats are not already booked
 * Step 3: Calculate total amount
 * Step 4: Create booking record with "pending" status (within a transaction)
 * Step 5: Increment seatsBooked on the trip (within same transaction)
 * Step 6: Publish booking event to RabbitMQ for async processing
 *
 * INPUT:
 * @param {string} userId
 * @param {string} companyId
 * @param {Object} data - { tripId, seats }
 *
 * OUTPUT:
 * @returns {Promise<Object>} Created booking + eventId
 *
 * SIDE EFFECTS:
 * - Publishes to booking.queue
 * - Locks seats via transaction (increments seatsBooked)
 */
const createBooking = async (userId, companyId, data) => {
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
        { companyId, userId, tripId: data.tripId, seats: data.seats, totalAmount, status: 'pending' },
        session
      );

      await tripRepository.incrementSeats(data.tripId, seatCount, session);
      await session.commitTransaction();
      session.endSession();

      const eventId = await publishBookingEvent({ userId, companyId, tripId: data.tripId, seats: data.seats });
      return { booking, eventId };
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
const getUserBookings = async (userId, companyId) => {
  const raw = await bookingRepository.findMany({ userId, companyId }, 1, 1000);
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
    if (booking.userId.toString() !== userId) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
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
    if (!isAdmin && booking.userId.toString() !== userId) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
    if (!['pending', 'confirmed'].includes(booking.status)) throw new AppError('Booking cannot be cancelled', 400, ErrorCodes.BOOKING_CANNOT_CANCEL);

    const updated = await bookingRepository.updateOne(id, companyId, { $set: { status: 'cancelled' } }, session);
    await tripRepository.incrementSeats(booking.tripId, -booking.seats.length, session);
    await session.commitTransaction();
    return updated;
  } finally {
    session.endSession();
  }
};

module.exports = { createBooking, getUserBookings, getAllBookings, getBookingById, cancelBooking };
