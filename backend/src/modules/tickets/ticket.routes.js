const express = require('express');
const router = express.Router();
const ticketController = require('./controllers/ticket.controller');
const { authenticate, downloadAuth, requireRole } = require('../auth/auth.middleware');

// Download routes use downloadAuth (supports token from query param)
router.get('/booking/:bookingId/download', downloadAuth, ticketController.downloadTicketByBookingId);
router.get('/:id/download', downloadAuth, ticketController.downloadTicket);

// All other routes require standard authentication
router.use(authenticate);

router.get('/my', ticketController.getUserTickets);
router.get('/', requireRole(['admin', 'manager']), ticketController.getAllTickets);
router.get('/booking/:bookingId', ticketController.getTicketByBookingId);
router.get('/:id', ticketController.getTicketById);
router.get('/:id/share', ticketController.shareTicket);
router.post('/verify', requireRole(['admin', 'staff']), ticketController.verifyTicket);

module.exports = router;
