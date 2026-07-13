const ticketService = require('./ticket.service');

const getUserTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getUserTickets(req.user._id, req.user.companyId);
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id, req.user._id, req.user.companyId, req.user.role === 'admin');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await ticketService.getAllTickets(req.user.companyId, filters, parseInt(page) || 1, parseInt(limit) || 10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const verifyTicket = async (req, res) => {
  try {
    const ticket = await ticketService.verifyTicket(req.user.companyId, req.body);
    res.json({ success: true, message: 'Ticket verified', data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getUserTickets, getTicketById, getAllTickets, verifyTicket };
