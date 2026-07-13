const request = require('supertest');
const app = require('../../src/app');
const Ticket = require('../../src/modules/tickets/models/Ticket');
const Booking = require('../../src/modules/bookings/models/Booking');
const ticketService = require('../../src/modules/tickets/ticket.service');
const { createTestUser } = require('../helpers/auth.helper');
const { setupTestRouteAndTrip, createTestBooking } = require('../helpers/booking.helper');

describe('Tickets Module Tests', () => {
  let adminToken;
  let customerToken;
  let user;
  let trip;
  let booking;

  beforeEach(async () => {
    const admin = await createTestUser({}, 'admin');
    adminToken = admin.token;

    const customer = await createTestUser({}, 'customer');
    customerToken = customer.token;
    user = customer.user;

    const data = await setupTestRouteAndTrip(40);
    trip = data.trip;

    booking = await createTestBooking(user._id, trip._id, ['1A']);
  });

  describe('Ticket Creation Logic', () => {
    it('should generate a valid Ticket with QR code', async () => {
      const ticket = await ticketService.createTicket(booking);
      expect(ticket.ticketNumber).toBeDefined();
      expect(ticket.qrCode).toBeDefined();
      expect(ticket.status).toBe('valid');
      expect(ticket.bookingId.toString()).toBe(booking._id.toString());
    });

    it('should enforce unique index constraint on bookingId', async () => {
      await ticketService.createTicket(booking);
      
      // Attempting duplicate ticket creation should throw error due to unique bookingId index
      await expect(ticketService.createTicket(booking)).rejects.toThrow();
    });
  });

  describe('POST /api/v1/tickets/verify', () => {
    let ticket;

    beforeEach(async () => {
      ticket = await ticketService.createTicket(booking);
    });

    it('should allow admin/staff to verify valid ticket and mark it used', async () => {
      const res = await request(app)
        .post('/api/v1/tickets/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ticketId: ticket._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('used');
      expect(res.body.data.scannedAt).toBeDefined();
    });

    it('should reject validation if ticket is already used', async () => {
      // Mark it used first
      ticket.status = 'used';
      await ticket.save();

      const res = await request(app)
        .post('/api/v1/tickets/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ticketId: ticket._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
