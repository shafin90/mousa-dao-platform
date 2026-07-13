const request = require('supertest');
const app = require('../../backend/src/app');
const { createTestUser, createAdminUser, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation, createBooking } = require('../helpers/factory.helper');

describe('Bookings API', () => {
  describe('POST /api/v1/bookings', () => {
    it('should queue a booking creation request', async () => {
      const { token, tenant } = await createTestUser({}, 'customer');
      const from = await createStation(tenant._id, { name: 'Cairo' });
      const to = await createStation(tenant._id, { name: 'Alex' });
      const route = await createRoute(tenant._id, { fromStation: from._id, toStation: to._id });
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id, seatsTotal: 40 });

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({ tripId: trip._id.toString(), seats: ['A1', 'A2'] });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eventId).toBeDefined();
    });

    it('should reject booking with missing fields', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/bookings/my', () => {
    it('should return current user bookings', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      await createBooking(tenant._id, user._id, trip._id, { status: 'confirmed' });

      const res = await request(app)
        .get('/api/v1/bookings/my')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should enforce user isolation for /my', async () => {
      const { user: user1, token: token1, tenant: tenant1 } = await createTestUser({}, 'customer');
      const { token: token2, tenant: tenant2 } = await createTestUser({}, 'customer');
      const trip1 = await createTrip(tenant1._id);
      const trip2 = await createTrip(tenant2._id);
      await createBooking(tenant1._id, user1._id, trip1._id);

      const res = await request(app)
        .get('/api/v1/bookings/my')
        .set('Authorization', getAuthHeader(token2));

      expect(res.body.data.length).toBe(0);
    });
  });

  describe('GET /api/v1/bookings (admin)', () => {
    it('should return paginated bookings for admin', async () => {
      const { user, token, tenant } = await createAdminUser();
      const trip = await createTrip(tenant._id);

      for (let i = 0; i < 5; i++) {
        const { user: cu } = await createTestUser({}, 'customer', tenant);
        await createBooking(tenant._id, cu._id, trip._id);
      }

      const res = await request(app)
        .get('/api/v1/bookings')
        .query({ page: 1, limit: 3 })
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.data.length).toBe(3);
    });

    it('should deny customers from listing all bookings', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/bookings/:id/cancel', () => {
    it('should cancel own booking', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id, { status: 'confirmed' });

      const res = await request(app)
        .patch(`/api/v1/bookings/${booking._id}/cancel`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('should not cancel another user booking', async () => {
      const { user: owner, tenant } = await createTestUser({}, 'customer');
      const { token: otherToken } = await createTestUser({}, 'customer', tenant);
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, owner._id, trip._id);

      const res = await request(app)
        .patch(`/api/v1/bookings/${booking._id}/cancel`)
        .set('Authorization', getAuthHeader(otherToken));

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should get own booking by id', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);

      const res = await request(app)
        .get(`/api/v1/bookings/${booking._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(booking._id.toString());
    });
  });
});
