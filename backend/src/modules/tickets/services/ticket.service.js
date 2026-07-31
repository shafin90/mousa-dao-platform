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
 * Creates a ticket for a completed booking.
 *
 * FLOW:
 * Step 1: Generate ticket number
 * Step 2: Generate QR code from booking data
 * Step 3: Persist ticket
 *
 * @param {Object} booking - { _id, userId, tripId, companyId }
 * @returns {Promise<Object>}
 */
const createTicket = async (booking, passengers) => {
  const ticketNumber = generateTicketNumber();
  const qrCode = await generateQRCode(booking);
  return await ticketRepository.create({
    companyId: booking.companyId,
    bookingId: booking._id,
    userId: booking.userId,
    tripId: booking.tripId,
    ticketNumber,
    qrCode,
    passengers: passengers || [],
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

/**
 * Generates a PDF buffer for a ticket.
 *
 * @param {Object} ticket - Full ticket document with populated trip/booking data
 * @returns {Promise<Buffer>}
 */
const generateTicketPDF = async (ticket) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  const pageWidth = doc.page.width - 80;

  doc.fontSize(22).font('Helvetica-Bold').text('MOUSA DAO TRANSPORT', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text('Electronic Ticket', { align: 'center' });
  doc.moveDown(0.5);

  doc.moveTo(40, doc.y).lineTo(40 + pageWidth, doc.y).stroke();
  doc.moveDown();

  const ticketData = ticket._doc || ticket;

  doc.fontSize(12).font('Helvetica-Bold').text(`Ticket #: `, { continued: true }).font('Helvetica').text(`${ticketData.ticketNumber || 'N/A'}`);
  doc.fontSize(12).font('Helvetica-Bold').text(`Status: `, { continued: true }).font('Helvetica').text(`${ticketData.status || 'N/A'}`);

  doc.moveDown();

  if (ticketData.bookingId) {
    const booking = typeof ticketData.bookingId === 'object' ? ticketData.bookingId : null;
    if (booking) {
      doc.fontSize(12).font('Helvetica-Bold').text(`Booking Code: `, { continued: true }).font('Helvetica').text(`${booking.bookingCode || 'N/A'}`);
      doc.fontSize(12).font('Helvetica-Bold').text(`Seats: `, { continued: true }).font('Helvetica').text(`${(booking.seats || []).join(', ') || 'N/A'}`);
    }
  }

  if (ticketData.passengers && ticketData.passengers.length > 0) {
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('Passengers');
    doc.moveDown(0.3);
    ticketData.passengers.forEach((p) => {
      doc.fontSize(10).text(`${p.name || 'N/A'}  |  Seat: ${p.seat || 'N/A'}  |  ${p.phone || ''}`);
    });
  }

  if (ticketData.tripId) {
    const trip = typeof ticketData.tripId === 'object' ? ticketData.tripId : null;
    if (trip) {
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').text('Trip Details');
      doc.moveDown(0.3);

      const route = trip.routeId && typeof trip.routeId === 'object' ? trip.routeId : null;
      const fromStation = trip.fromStation && typeof trip.fromStation === 'object' ? trip.fromStation : null;
      const toStation = trip.toStation && typeof trip.toStation === 'object' ? trip.toStation : null;

      if (route) {
        const fromCity = route.fromCity && typeof route.fromCity === 'object' ? route.fromCity.name || '' : '';
        const toCity = route.toCity && typeof route.toCity === 'object' ? route.toCity.name || '' : '';
        doc.fontSize(11).text(`${fromCity} → ${toCity}`);
      }
      if (fromStation) doc.fontSize(10).text(`From: ${fromStation.name || 'N/A'}`);
      if (toStation) doc.fontSize(10).text(`To: ${toStation.name || 'N/A'}`);

      doc.fontSize(10).text(`Date: ${trip.date ? new Date(trip.date).toLocaleDateString() : 'N/A'}`);
      doc.fontSize(10).text(`Departure: ${trip.departureTime || 'N/A'}  |  Arrival: ${trip.arrivalTime || 'N/A'}`);
      doc.fontSize(10).text(`Price: ${trip.price || 'N/A'}`);

      const bus = trip.busId && typeof trip.busId === 'object' ? trip.busId : null;
      if (bus) {
        doc.fontSize(10).text(`Bus: ${bus.busNumber || ''} - ${bus.name || ''}`);
      }
    }
  }

  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(40 + pageWidth, doc.y).stroke();
  doc.moveDown();

  if (ticketData.qrCode) {
    try {
      const imgData = ticketData.qrCode.replace(/^data:image\/png;base64,/, '');
      doc.image(Buffer.from(imgData, 'base64'), 40, doc.y, { width: 120, height: 120 });
    } catch {
      doc.fontSize(10).text('QR Code: [unavailable]');
    }
  }

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
};

/**
 * Generates and returns a PDF buffer for a ticket.
 *
 * @param {string} ticketId
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Buffer>}
 */
const downloadTicket = async (ticketId, userId, companyId) => {
  const ticket = await ticketRepository.findById(ticketId, companyId);
  if (!ticket) throw new AppError('Ticket not found', 404, ErrorCodes.TICKET_NOT_FOUND);
  if (ticket.userId.toString() !== String(userId)) {
    throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
  }

  const populated = await require('../models/Ticket').findById(ticket._id)
    .populate({
      path: 'tripId',
      populate: [
        { path: 'busId', select: 'busNumber name capacity type' },
        {
          path: 'routeId',
          populate: [
            { path: 'fromCity', select: 'name' },
            { path: 'toCity', select: 'name' },
          ],
        },
        { path: 'fromStation', select: 'name' },
        { path: 'toStation', select: 'name' },
      ],
    })
    .populate({ path: 'bookingId', select: 'bookingCode seats' });

  return await generateTicketPDF(populated);
};

const generateShareLink = async (ticketId, userId, companyId) => {
  const ticket = await ticketRepository.findById(ticketId, companyId);
  if (!ticket) throw new AppError('Ticket not found', 404, ErrorCodes.TICKET_NOT_FOUND);
  if (ticket.userId.toString() !== String(userId)) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return { shareUrl: `${baseUrl}/share/ticket/${ticketId}`, ticketNumber: ticket.ticketNumber };
};

/**
 * Fetches a ticket by booking ID within company scope.
 *
 * @param {string} bookingId
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getTicketByBooking = async (bookingId, userId, companyId) => {
  const ticket = await ticketRepository.findByBookingPopulated(bookingId, companyId);
  if (!ticket) return null;
  if (ticket.userId.toString() !== String(userId)) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
  return ticket;
};

/**
 * Generates and returns a PDF buffer for a ticket by booking ID.
 *
 * @param {string} bookingId
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Buffer>}
 */
const downloadTicketByBooking = async (bookingId, userId, companyId) => {
  const ticket = await ticketRepository.findByBooking(bookingId, companyId);
  if (!ticket) throw new AppError('Ticket not found', 404, ErrorCodes.TICKET_NOT_FOUND);
  if (ticket.userId.toString() !== String(userId)) {
    throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
  }

  const populated = await require('../models/Ticket').findById(ticket._id)
    .populate({
      path: 'tripId',
      populate: [
        { path: 'busId', select: 'busNumber name capacity type' },
        {
          path: 'routeId',
          populate: [
            { path: 'fromCity', select: 'name' },
            { path: 'toCity', select: 'name' },
          ],
        },
        { path: 'fromStation', select: 'name' },
        { path: 'toStation', select: 'name' },
      ],
    })
    .populate({ path: 'bookingId', select: 'bookingCode seats' });

  return await generateTicketPDF(populated);
};

module.exports = { createTicket, getUserTickets, getTicketById, getTicketByBooking, getAllTickets, verifyTicket, downloadTicket, downloadTicketByBooking, generateShareLink };
