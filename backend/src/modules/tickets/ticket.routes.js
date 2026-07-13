const express = require('express');
const router = express.Router();
const ticketController = require('./controllers/ticket.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/my', ticketController.getUserTickets);
router.get('/', requireRole(['admin']), ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/verify', requireRole(['admin', 'staff']), ticketController.verifyTicket);

module.exports = router;
