const ticketService = require('../services/ticket.service');
const { respond, respondPaginated } = require('../../../utils/response');

const getUserTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getUserTickets(req.user._id, req.user.companyId);
    respond(res, 200, tickets);
  } catch (error) { next(error); }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id, req.user._id, req.user.companyId, req.user.role === 'admin');
    if (!ticket) return respond(res, 404, null, 'Ticket not found');
    respond(res, 200, ticket);
  } catch (error) { next(error); }
};

const getAllTickets = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await ticketService.getAllTickets(req.user.companyId, filters, Number(page) || 1, Number(limit) || 10);
    respondPaginated(res, data.tickets, data.total, Number(page) || 1, Number(limit) || 10);
  } catch (error) { next(error); }
};

const verifyTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.verifyTicket(req.user.companyId, req.body);
    respond(res, 200, ticket, 'Ticket verified');
  } catch (error) { next(error); }
};

const downloadTicket = async (req, res, next) => {
  try {
    const pdfBuffer = await ticketService.downloadTicket(req.params.id, req.user._id, req.user.companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${req.params.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) { next(error); }
};

const getTicketByBookingId = async (req, res, next) => {
  try {
    const ticket = await ticketService.getTicketByBooking(req.params.bookingId, req.user._id, req.user.companyId);
    if (!ticket) return respond(res, 404, null, 'Ticket not found');
    respond(res, 200, ticket);
  } catch (error) { next(error); }
};

const downloadTicketByBookingId = async (req, res, next) => {
  try {
    const pdfBuffer = await ticketService.downloadTicketByBooking(req.params.bookingId, req.user._id, req.user.companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${req.params.bookingId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) { next(error); }
};

const shareTicket = async (req, res, next) => {
  try {
    const result = await ticketService.generateShareLink(req.params.id, req.user._id, req.user.companyId);
    respond(res, 200, result);
  } catch (error) { next(error); }
};

module.exports = { getUserTickets, getTicketById, getAllTickets, verifyTicket, downloadTicket, getTicketByBookingId, downloadTicketByBookingId, shareTicket };
