const Ticket = require('./models/Ticket');
const User = require('../users/models/User');
const QRCode = require('qrcode');

const createTicket = async (booking) => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `TKT-${year}-${random}`;

  const payload = JSON.stringify({
    bookingId: booking._id,
    userId: booking.userId,
    tripId: booking.tripId
  });

  const qrCode = await QRCode.toDataURL(payload);

  return await Ticket.create({
    companyId: booking.companyId,
    bookingId: booking._id,
    userId: booking.userId,
    tripId: booking.tripId,
    ticketNumber,
    qrCode
  });
};

const getUserTickets = async (userId, companyId) => {
  return await Ticket.find({ userId, companyId })
    .populate({ path: 'tripId', populate: { path: 'routeId', populate: { path: 'fromStation toStation' } } })
    .populate('userId')
    .populate('bookingId');
};

const getTicketById = async (id, userId, companyId, isAdmin) => {
  const ticket = await Ticket.findOne({ _id: id, companyId })
    .populate({ path: 'tripId', populate: { path: 'routeId', populate: { path: 'fromStation toStation' } } })
    .populate('userId')
    .populate('bookingId');
  if (!ticket) return null;
  if (!isAdmin && ticket.userId.toString() !== userId) throw new Error('Unauthorized');
  return ticket;
};

const getAllTickets = async (companyId, filters, page = 1, limit = 10) => {
  const query = { companyId };
  if (filters.status) query.status = filters.status;
  if (filters.tripId) query.tripId = filters.tripId;
  if (filters.userId) query.userId = filters.userId;
  if (filters.search) {
    const users = await User.find({
      companyId,
      $or: [
        { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
        { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ]
    }).select('_id');
    query.userId = { $in: users.map(u => u._id) };
  }

  const tickets = await Ticket.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: 'tripId', populate: { path: 'routeId', populate: { path: 'fromStation toStation' } } })
    .populate('userId')
    .populate('bookingId');
  
  const total = await Ticket.countDocuments(query);
  return { tickets, total };
};

const verifyTicket = async (companyId, data) => {
  const query = { companyId };
  if (data.ticketId) query._id = data.ticketId;
  else query.qrCode = data.qrData;

  const ticket = await Ticket.findOne(query);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.status !== 'valid') throw new Error(`Ticket is already ${ticket.status}`);

  ticket.status = 'used';
  ticket.scannedAt = new Date();
  await ticket.save();

  return ticket;
};

module.exports = { createTicket, getUserTickets, getTicketById, getAllTickets, verifyTicket };
