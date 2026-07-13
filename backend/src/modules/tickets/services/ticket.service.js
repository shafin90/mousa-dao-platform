const QRCode = require('qrcode');
const ticketRepository = require('../repositories/ticket.repository');
const userRepository = require('../../users/repositories/user.repository');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Generates a unique ticket number.
 *
 * @returns {string}
 */
const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${year}-${random}`;
};

/**
 * Generates a QR code data URL from booking metadata.
 *
 * @param {Object} booking - { _id, userId, tripId }
 * @returns {Promise<string>} QR data URL
 */
const generateQRCode = async (booking) => {
  const payload = JSON.stringify({ bookingId: booking._id, userId: booking.userId, tripId: booking.tripId });
  return await QRCode.toDataURL(payload);
};

/**
 * Creates a ticket for a confirmed booking.
 *
 * FLOW:
 * Step 1: Generate ticket number
 * Step 2: Generate QR code from booking data
 * Step 3: Persist ticket
 *
 * @param {Object} booking - { _id, userId, tripId, companyId }
 * @returns {Promise<Object>}
 */
const createTicket = async (booking) => {
  const ticketNumber = generateTicketNumber();
  const qrCode = await generateQRCode(booking);
  return await ticketRepository.create({
    companyId: booking.companyId,
    bookingId: booking._id,
    userId: booking.userId,
    tripId: booking.tripId,
    ticketNumber,
    qrCode,
  });
};

/**
 * Fetches a user's tickets within company.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getUserTickets = async (userId, companyId) => {
  return await ticketRepository.findByUser(userId, companyId);
};

/**
 * Fetches a single ticket within company scope.
 *
 * @param {string} id
 * @param {string} userId
 * @param {string} companyId
 * @param {boolean} isAdmin
 * @returns {Promise<Object|null>}
 */
const getTicketById = async (id, userId, companyId, isAdmin) => {
  const ticket = await ticketRepository.findById(id, companyId);
  if (!ticket) return null;
  if (!isAdmin && ticket.userId.toString() !== userId) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
  return ticket;
};

/**
 * Lists tickets with pagination within company.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getAllTickets = async (companyId, filters, page, limit) => {
  return await ticketRepository.findMany(companyId, filters, page, limit);
};

/**
 * Verifies a ticket by ID or QR data and marks it as used.
 *
 * FLOW:
 * Step 1: Build query from ticketId or qrData
 * Step 2: Atomically update valid → used (with scannedAt)
 * Step 3: Throw if not found or already used
 *
 * @param {string} companyId
 * @param {Object} data - { ticketId?, qrData? }
 * @returns {Promise<Object>}
 */
const verifyTicket = async (companyId, data) => {
  const query = {};
  if (data.ticketId) query._id = data.ticketId;
  else query.qrCode = data.qrData;

  const ticket = await ticketRepository.findAndMarkUsed(companyId, query);
  if (!ticket) {
    const exists = await ticketRepository.findById(data.ticketId, companyId) || await ticketRepository.findByBooking(data.qrData, companyId);
    if (!exists) throw new AppError('Ticket not found', 404, ErrorCodes.TICKET_NOT_FOUND);
    throw new AppError(`Ticket is already ${exists.status}`, 400, ErrorCodes.TICKET_ALREADY_USED);
  }
  return ticket;
};

module.exports = { createTicket, getUserTickets, getTicketById, getAllTickets, verifyTicket };
