const Booking = require('../models/Booking');
const mongoose = require('mongoose');

/**
 * Finds a booking by ID scoped to a company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await Booking.findOne({ _id: id, companyId });
};

/**
 * Creates a booking record within an optional transaction session.
 *
 * @param {Object} data - { companyId, userId, tripId, seats, totalAmount, status }
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object>}
 */
const create = async (data, session) => {
  const [booking] = await Booking.create([data], session ? { session } : {});
  return booking;
};

/**
 * Updates a booking's status within a transaction session.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update - Fields to update
 * @param {Object} [session]
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update, session) => {
  const opts = { new: true };
  if (session) opts.session = session;
  return await Booking.findOneAndUpdate({ _id: id, companyId }, update, opts);
};

/**
 * Finds all bookings matching filters, with pagination.
 *
 * @param {Object} filters - { companyId, tripId, userId, status, ... }
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{bookings: Array, total: number}>}
 */
const findMany = async (filters, page = 1, limit = 10) => {
  const bookings = await Booking.find(filters)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: 'userId', select: 'email phone profile' })
    .populate({
      path: 'tripId',
      select: 'routeId busId departureTime arrivalTime date price seatsTotal seatsBooked status',
      populate: [
        { path: 'routeId', populate: [{ path: 'fromStation', select: 'name location' }, { path: 'toStation', select: 'name location' }] },
        { path: 'busId', select: 'busNumber name capacity type' },
      ],
    });
  const total = await Booking.countDocuments(filters);
  return { bookings, total };
};

/**
 * Finds bookings for a specific trip excluding cancelled ones.
 * Used for conflict checking.
 *
 * @param {string} tripId
 * @param {string} companyId
 * @param {Object} [session]
 * @returns {Promise<Array>}
 */
const findByTripExcludingCancelled = async (tripId, companyId, session) => {
  const query = Booking.find({ tripId, companyId, status: { $ne: 'cancelled' } });
  if (session) query.session(session);
  return await query;
};

/**
 * Atomically confirms a booking (pending + unpaid → confirmed + paid).
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} [session]
 * @returns {Promise<Object|null>}
 */
const confirmPayment = async (id, companyId, session) => {
  const opts = { new: true };
  if (session) opts.session = session;
  return await Booking.findOneAndUpdate(
    { _id: id, companyId, status: 'pending', paymentStatus: 'unpaid' },
    { $set: { status: 'confirmed', paymentStatus: 'paid' } },
    opts
  );
};

module.exports = { findById, create, updateOne, findMany, findByTripExcludingCancelled, confirmPayment };
