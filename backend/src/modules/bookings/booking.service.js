const Booking = require('./models/Booking');
const Trip = require('../trips/models/Trip');
const User = require('../users/models/User');
const mongoose = require('mongoose');

const createBooking = async (userId, companyId, data) => {
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const trip = await Trip.findOne({ _id: data.tripId, companyId }).session(session);
      if (!trip) throw new Error('Trip not found');
      if (trip.status !== 'scheduled') throw new Error('Trip is not available for booking');

      if (trip.seatsBooked + data.seats.length > trip.seatsTotal) {
        throw new Error('Not enough seats available');
      }

      const existingBookings = await Booking.find({
        tripId: data.tripId,
        companyId,
        status: { $ne: 'cancelled' }
      }).session(session);
      const bookedSeats = existingBookings.flatMap(b => b.seats);
      for (const seat of data.seats) {
        if (bookedSeats.includes(seat)) {
          throw new Error(`Seat ${seat} is already booked`);
        }
      }

      const totalAmount = data.seats.length * trip.price;

      const booking = await Booking.create([{
        companyId,
        userId,
        tripId: data.tripId,
        seats: data.seats,
        totalAmount,
        status: 'pending'
      }], { session });

      await Trip.findByIdAndUpdate(data.tripId, { $inc: { seatsBooked: data.seats.length } }, { session });

      await session.commitTransaction();
      session.endSession();
      return booking[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      const isTransient = error.errorLabels && error.errorLabels.includes('TransientTransactionError');
      if (isTransient && attempt < MAX_RETRIES - 1) {
        attempt++;
        await new Promise(r => setTimeout(r, 50 * attempt));
        continue;
      }

      throw error;
    }
  }
};

const populateBooking = [
  { path: 'userId' },
  {
    path: 'tripId',
    populate: [
      {
        path: 'routeId',
        populate: [
          { path: 'fromStation' },
          { path: 'toStation' },
        ],
      },
      { path: 'busId' },
    ],
  },
];

const getUserBookings = async (userId, companyId) => {
  return await Booking.find({ userId, companyId }).populate(populateBooking);
};

const getAllBookings = async (companyId, filters, page = 1, limit = 10) => {
  const query = { companyId };
  if (filters.tripId) query.tripId = filters.tripId;
  if (filters.userId) query.userId = filters.userId;
  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;

  if (filters.amountMin || filters.amountMax) {
    query.totalAmount = {};
    if (filters.amountMin) query.totalAmount.$gte = Number(filters.amountMin);
    if (filters.amountMax) query.totalAmount.$lte = Number(filters.amountMax);
  }

  if (filters.dateFrom || filters.dateTo) {
    const tripQuery = { companyId };
    if (filters.dateFrom) tripQuery.date = { $gte: new Date(filters.dateFrom) };
    if (filters.dateTo) tripQuery.date = { ...tripQuery.date, $lte: new Date(filters.dateTo) };
    const tripIds = await Trip.find(tripQuery).select('_id').lean();
    query.tripId = { $in: tripIds.map(t => t._id) };
  }

  if (filters.search) {
    const userMatch = await User.find({ companyId, email: { $regex: filters.search, $options: 'i' } }).select('_id').lean();
    query.$or = [
      { bookingCode: { $regex: filters.search, $options: 'i' } },
      { userId: { $in: userMatch.map(u => u._id) } },
    ];
  }

  const bookings = await Booking.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate(populateBooking);
  
  const total = await Booking.countDocuments(query);
  return { bookings, total };
};

const getBookingById = async (id, userId, companyId, isAdmin) => {
  const query = { _id: id, companyId };
  if (!isAdmin) query.userId = userId;
  const booking = await Booking.findOne(query).populate(populateBooking);
  if (!booking) return null;
  if (!isAdmin && booking.userId.toString() !== userId) throw new Error('Unauthorized');
  return booking;
};

const cancelBooking = async (id, userId, companyId, isAdmin) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({ _id: id, companyId }).session(session);
    if (!booking) throw new Error('Booking not found');
    if (!isAdmin && booking.userId.toString() !== userId.toString()) throw new Error('Unauthorized');
    if (!['pending', 'confirmed'].includes(booking.status)) throw new Error('Booking cannot be cancelled');

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: id, companyId },
      { $set: { status: 'cancelled' } },
      { session, new: true }
    );

    await Trip.findByIdAndUpdate(booking.tripId, { $inc: { seatsBooked: -booking.seats.length } }, { session });

    await session.commitTransaction();
    return updatedBooking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { createBooking, getUserBookings, getAllBookings, getBookingById, cancelBooking };
