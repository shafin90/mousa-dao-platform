const Route = require('../../src/modules/trips/models/Route');
const Trip = require('../../src/modules/trips/models/Trip');
const Bus = require('../../src/modules/fleet/models/Bus');
const Booking = require('../../src/modules/bookings/models/Booking');
const mongoose = require('mongoose');

const setupTestRouteAndTrip = async (seatsCapacity = 40, companyId = null) => {
  companyId = companyId || new mongoose.Types.ObjectId();

  const bus = await Bus.create({
    busNumber: `BUS-${Math.random()}`,
    name: 'VIP Volvo Executive',
    capacity: seatsCapacity,
    type: 'VIP',
    status: 'active',
    companyId,
  });

  const route = await Route.create({
    companyId,
    fromCity: new mongoose.Types.ObjectId(),
    toCity: new mongoose.Types.ObjectId(),
    distanceKm: 120,
    estimatedTimeMinutes: 90,
  });

  const trip = await Trip.create({
    companyId,
    routeId: route._id,
    busId: bus._id,
    fromStation: new mongoose.Types.ObjectId(),
    toStation: new mongoose.Types.ObjectId(),
    departureTime: '08:00 AM',
    arrivalTime: '09:30 AM',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    price: 50,
    seatsTotal: seatsCapacity,
    seatsBooked: 0,
    status: 'scheduled',
  });

  return { route, bus, trip, companyId };
};

const createTestBooking = async (userId, tripId, seats = ['1', '2'], companyId = null) => {
  return await Booking.create({
    userId,
    tripId,
    companyId: companyId || new mongoose.Types.ObjectId(),
    seats,
    totalAmount: seats.length * 50,
    status: 'pending',
    paymentStatus: 'unpaid',
  });
};

module.exports = { setupTestRouteAndTrip, createTestBooking };
