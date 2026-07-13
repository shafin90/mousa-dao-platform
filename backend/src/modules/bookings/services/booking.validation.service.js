const tripRepository = require('../../trips/repositories/trip.repository');
const bookingRepository = require('../repositories/booking.repository');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Validates that a trip exists and is available for booking.
 *
 * FLOW:
 * 1. Fetch trip by ID and company
 * 2. Check trip exists
 * 3. Check trip status is 'scheduled'
 * 4. Check enough seats are available
 *
 * INPUT:
 * @param {string} tripId
 * @param {string} companyId
 * @param {number} seatCount
 *
 * OUTPUT:
 * @returns {Promise<Object>} Trip document
 *
 * SIDE EFFECTS: None
 */
const validateTripAvailability = async (tripId, companyId, seatCount) => {
  const trip = await tripRepository.findById(tripId, companyId);
  if (!trip) throw new AppError('Trip not found', 404, ErrorCodes.TRIP_NOT_FOUND);
  if (trip.status !== 'scheduled') throw new AppError('Trip is not available for booking', 400, ErrorCodes.TRIP_NOT_AVAILABLE);
  if (trip.seatsBooked + seatCount > trip.seatsTotal) throw new AppError('Not enough seats available', 400, ErrorCodes.NOT_ENOUGH_SEATS);
  return trip;
};

/**
 * Checks that none of the requested seats are already booked.
 *
 * FLOW:
 * 1. Fetch all non-cancelled bookings for the trip
 * 2. Collect all booked seat numbers
 * 3. Check requested seats against booked seats
 *
 * INPUT:
 * @param {string} tripId
 * @param {string} companyId
 * @param {Array<string>} seats - Seat numbers to check
 * @param {Object} [session] - Mongoose session
 *
 * OUTPUT:
 * @returns {Promise<void>}
 *
 * SIDE EFFECTS: None
 */
const checkSeatConflicts = async (tripId, companyId, seats, session) => {
  const existingBookings = await bookingRepository.findByTripExcludingCancelled(tripId, companyId, session);
  const bookedSeats = existingBookings.flatMap((b) => b.seats);
  for (const seat of seats) {
    if (bookedSeats.includes(seat)) {
      throw new AppError(`Seat ${seat} is already booked`, 409, ErrorCodes.SEAT_ALREADY_BOOKED);
    }
  }
};

/**
 * Builds the total amount for a booking based on seat count and trip price.
 *
 * @param {Array<string>} seats
 * @param {number} pricePerSeat
 * @returns {number}
 */
const calculateTotalAmount = (seats, pricePerSeat) => {
  return seats.length * pricePerSeat;
};

module.exports = { validateTripAvailability, checkSeatConflicts, calculateTotalAmount };
