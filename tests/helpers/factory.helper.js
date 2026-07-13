const Station = require('../../backend/src/modules/stations/models/Station');
const City = require('../../backend/src/modules/stations/models/City');
const Route = require('../../backend/src/modules/trips/models/Route');
const Trip = require('../../backend/src/modules/trips/models/Trip');
const Bus = require('../../backend/src/modules/fleet/models/Bus');
const Booking = require('../../backend/src/modules/bookings/models/Booking');
const Payment = require('../../backend/src/modules/payments/models/Payment');
const Ticket = require('../../backend/src/modules/tickets/models/Ticket');
const Config = require('../../backend/src/modules/config/config.model');
const Notification = require('../../backend/src/modules/notifications/models/Notification');
const BusLocation = require('../../backend/src/modules/tracking/models/BusLocation');

const createCity = async (companyId, overrides = {}) => {
  return City.create({
    companyId,
    name: overrides.name || `City-${Date.now()}`,
  });
};

const createStation = async (companyId, overrides = {}) => {
  let cityId = overrides.cityId;
  if (!cityId) {
    const city = await createCity(companyId);
    cityId = city._id;
  }
  return Station.create({
    companyId,
    name: overrides.name || `Station-${Date.now()}`,
    cityId,
    address: overrides.address || `${overrides.name || 'Station'} Address`,
    location: {
      lat: overrides.lat || 30.0444,
      lng: overrides.lng || 31.2357,
    },
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
};

const createRoute = async (companyId, overrides = {}) => {
  let fromStation = overrides.fromStation;
  let toStation = overrides.toStation;
  if (!fromStation) {
    fromStation = await createStation(companyId, { name: 'From-Station' });
    fromStation = fromStation._id;
  }
  if (!toStation) {
    toStation = await createStation(companyId, { name: 'To-Station' });
    toStation = toStation._id;
  }
  return Route.create({
    companyId,
    fromStation,
    toStation,
    baseFare: overrides.baseFare || 50,
    distanceKm: overrides.distanceKm || 200,
    estimatedTimeMinutes: overrides.estimatedTimeMinutes || 180,
  });
};

const createBus = async (companyId, overrides = {}) => {
  return Bus.create({
    companyId,
    busNumber: overrides.busNumber || `BUS-${Date.now()}`,
    name: overrides.name || 'Test Bus',
    capacity: overrides.capacity || 40,
    type: overrides.type || 'AC',
    status: overrides.status || 'active',
    features: overrides.features || {},
  });
};

const createTrip = async (companyId, overrides = {}) => {
  let routeId = overrides.routeId;
  let busId = overrides.busId;
  if (!routeId) {
    const route = await createRoute(companyId);
    routeId = route._id;
  }
  if (!busId) {
    const bus = await createBus(companyId);
    busId = bus._id;
  }
  return Trip.create({
    companyId,
    routeId,
    busId,
    departureTime: overrides.departureTime || '08:00',
    arrivalTime: overrides.arrivalTime || '12:00',
    date: overrides.date || new Date(Date.now() + 86400000),
    price: overrides.price || 50,
    seatsTotal: overrides.seatsTotal || 40,
    seatsBooked: overrides.seatsBooked || 0,
    status: overrides.status || 'scheduled',
  });
};

const createBooking = async (companyId, userId, tripId, overrides = {}) => {
  return Booking.create({
    companyId,
    userId,
    tripId,
    seats: overrides.seats || ['A1'],
    totalAmount: overrides.totalAmount || 50,
    status: overrides.status || 'confirmed',
    paymentStatus: overrides.paymentStatus || 'paid',
  });
};

const createPayment = async (companyId, userId, bookingId, overrides = {}) => {
  return Payment.create({
    companyId,
    bookingId,
    userId,
    method: overrides.method || 'flutterwave',
    tx_ref: overrides.tx_ref || `TX-${Date.now()}`,
    transactionId: overrides.transactionId || `TXN-${Date.now()}`,
    amount: overrides.amount || 50,
    status: overrides.status || 'success',
  });
};

const createTicket = async (companyId, userId, bookingId, tripId, overrides = {}) => {
  return Ticket.create({
    companyId,
    bookingId,
    userId,
    tripId,
    ticketNumber: overrides.ticketNumber || `TKT-${Date.now()}`,
    qrCode: overrides.qrCode || `qr-${Date.now()}-data`,
    status: overrides.status || 'valid',
  });
};

const createBusLocation = async (companyId, busId, tripId, overrides = {}) => {
  return BusLocation.create({
    companyId,
    busId,
    tripId,
    latitude: overrides.latitude || 30.0444,
    longitude: overrides.longitude || 31.2357,
    speed: overrides.speed || 60,
    heading: overrides.heading || 90,
    updatedAt: overrides.updatedAt || new Date(),
  });
};

const createNotification = async (companyId, userId, overrides = {}) => {
  return Notification.create({
    companyId,
    userId,
    type: overrides.type || 'booking',
    message: overrides.message || 'Test notification',
    isRead: overrides.isRead || false,
  });
};

const createConfig = async (companyId, overrides = {}) => {
  return Config.create({
    companyId,
    baseCurrency: overrides.baseCurrency || 'XOF',
    timezone: overrides.timezone || 'UTC',
    platformCommissionPercentage: overrides.platformCommissionPercentage || 10,
    driverCommissionPercentage: overrides.driverCommissionPercentage || 80,
    taxPercentage: overrides.taxPercentage || 5,
    maintenanceMode: overrides.maintenanceMode || false,
  });
};

module.exports = {
  createCity,
  createStation,
  createRoute,
  createBus,
  createTrip,
  createBooking,
  createPayment,
  createTicket,
  createBusLocation,
  createNotification,
  createConfig,
};
