const request = require('supertest');
const app = require('../../backend/src/app');
const { createTestUser, createAdminUser, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation, createBooking, createTicket } = require('../helpers/factory.helper');

describe('Tickets API', () => {
  describe('GET /api/v1/tickets/my', () => {
    it('should return current user tickets', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      await createTicket(tenant._id, user._id, booking._id, trip._id);

      const res = await request(app)
        .get('/api/v1/tickets/my')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/v1/tickets/:id', () => {
    it('should get own ticket by id', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      const ticket = await createTicket(tenant._id, user._id, booking._id, trip._id);

      const res = await request(app)
        .get(`/api/v1/tickets/${ticket._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.ticketNumber).toBe(ticket.ticketNumber);
    });
  });

  describe('POST /api/v1/tickets/verify', () => {
    it('should verify a valid ticket', async () => {
      const { user, token: staffToken, tenant } = await createTestUser({}, 'staff');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      const ticket = await createTicket(tenant._id, user._id, booking._id, trip._id, { ticketNumber: 'TKT-VERIFY-001' });

      const res = await request(app)
        .post('/api/v1/tickets/verify')
        .set('Authorization', getAuthHeader(staffToken))
        .send({ ticketNumber: ticket.ticketNumber });

      expect(res.status).toBe(200);
      expect(res.body.data.ticketNumber).toBe(ticket.ticketNumber);
      expect(res.body.data.status).toBe('valid');
    });

    it('should reject ticket verification by customer', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .post('/api/v1/tickets/verify')
        .set('Authorization', getAuthHeader(token))
        .send({ ticketNumber: 'TKT-FAKE' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/tickets (admin)', () => {
    it('should list all tickets as admin', async () => {
      const { user, token, tenant } = await createAdminUser();
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      await createTicket(tenant._id, user._id, booking._id, trip._id);

      const res = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should deny customers from listing all tickets', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(403);
    });
  });
});
