const request = require('supertest');
const app = require('../../backend/src/app');
const { createAdminUser, createTestUser, getAuthHeader, createTestTenant } = require('../helpers/auth.helper');
const {
  createStation, createRoute, createBus, createTrip,
  createBooking, createPayment, createTicket, createCity,
} = require('../helpers/factory.helper');

describe('BackOffice ↔ Backend Integration', () => {
  let admin, adminToken, tenant;

  beforeAll(async () => {
    const result = await createAdminUser();
    admin = result.user;
    adminToken = result.token;
    tenant = result.tenant;
  });

  describe('Bus CRUD', () => {
    it('should create, read, update, and delete a bus', async () => {
      const createRes = await request(app)
        .post('/api/v1/buses')
        .set('Authorization', getAuthHeader(adminToken))
        .send({ busNumber: `BUS-CRUD-${Date.now()}`, name: 'CRUD Bus', capacity: 50, type: 'AC' });
      expect(createRes.status).toBe(201);
      const busId = createRes.body.data._id;

      const getRes = await request(app)
        .get(`/api/v1/buses/${busId}`)
        .set('Authorization', getAuthHeader(adminToken));
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.name).toBe('CRUD Bus');

      const updateRes = await request(app)
        .patch(`/api/v1/buses/${busId}`)
        .set('Authorization', getAuthHeader(adminToken))
        .send({ name: 'Updated Bus' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Updated Bus');

      const deleteRes = await request(app)
        .delete(`/api/v1/buses/${busId}`)
        .set('Authorization', getAuthHeader(adminToken));
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Station CRUD', () => {
    it('should create, read, update, and delete a station', async () => {
      const city = await createCity(tenant._id);

      const createRes = await request(app)
        .post('/api/v1/stations')
        .set('Authorization', getAuthHeader(adminToken))
        .send({ name: 'Test Station', cityId: city._id.toString(), location: { lat: 30.0, lng: 31.0 } });
      expect(createRes.status).toBe(201);
      const stationId = createRes.body.data._id;

      const getRes = await request(app)
        .get(`/api/v1/stations/${stationId}`)
        .set('Authorization', getAuthHeader(adminToken));
      expect(getRes.status).toBe(200);

      const updateRes = await request(app)
        .patch(`/api/v1/stations/${stationId}`)
        .set('Authorization', getAuthHeader(adminToken))
        .send({ name: 'Updated Station' });
      expect(updateRes.status).toBe(200);

      const deleteRes = await request(app)
        .delete(`/api/v1/stations/${stationId}`)
        .set('Authorization', getAuthHeader(adminToken));
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Trip CRUD', () => {
    it('should create, read, update status, and delete a trip', async () => {
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);

      const createRes = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', getAuthHeader(adminToken))
        .send({
          routeId: route._id.toString(),
          busId: bus._id.toString(),
          departureTime: '06:00',
          arrivalTime: '10:00',
          date: new Date(Date.now() + 86400000).toISOString(),
          price: 80,
          seatsTotal: 40,
        });
      expect(createRes.status).toBe(201);
      const tripId = createRes.body.data._id;

      const getRes = await request(app)
        .get(`/api/v1/trips/${tripId}`)
        .set('Authorization', getAuthHeader(adminToken));
      expect(getRes.status).toBe(200);

      const statusRes = await request(app)
        .patch(`/api/v1/trips/${tripId}/status`)
        .set('Authorization', getAuthHeader(adminToken))
        .send({ status: 'active' });
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('active');

      const deleteRes = await request(app)
        .delete(`/api/v1/trips/${tripId}`)
        .set('Authorization', getAuthHeader(adminToken));
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Booking List (admin)', () => {
    it('should retrieve paginated bookings', async () => {
      const { user } = await createTestUser({}, 'customer', tenant);
      const trip = await createTrip(tenant._id);
      await createBooking(tenant._id, user._id, trip._id);
      await createBooking(tenant._id, user._id, trip._id, { seats: ['B1'] });

      const res = await request(app)
        .get('/api/v1/bookings')
        .query({ page: 1, limit: 10 })
        .set('Authorization', getAuthHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should require admin role', async () => {
      const { token } = await createTestUser({}, 'staff', tenant);
      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token));
      expect(res.status).toBe(403);
    });
  });

  describe('Payment List (admin)', () => {
    it('should retrieve all payments as admin', async () => {
      const { user } = await createTestUser({}, 'customer', tenant);
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      await createPayment(tenant._id, user._id, booking._id, { tx_ref: `TX-BO-${Date.now()}` });

      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', getAuthHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('Ticket Verify (staff)', () => {
    it('should verify ticket by ticketNumber', async () => {
      const { user } = await createTestUser({}, 'customer', tenant);
      const { token: staffToken } = await createTestUser({}, 'staff', tenant);
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      const ticket = await createTicket(tenant._id, user._id, booking._id, trip._id, { ticketNumber: `TKT-VFY-${Date.now()}` });

      const res = await request(app)
        .post('/api/v1/tickets/verify')
        .set('Authorization', getAuthHeader(staffToken))
        .send({ ticketNumber: ticket.ticketNumber });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('valid');
    });
  });

  describe('Analytics (admin)', () => {
    it('should access dashboard analytics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', getAuthHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should access revenue analytics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/revenue')
        .set('Authorization', getAuthHeader(adminToken));

      expect(res.status).toBe(200);
    });

    it('should deny analytics for non-admin', async () => {
      const { token } = await createTestUser({}, 'staff', tenant);
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', getAuthHeader(token));
      expect(res.status).toBe(403);
    });
  });

  describe('Tenant Isolation', () => {
    it('should isolate data between different tenants', async () => {
      const { token: adminToken2, tenant: tenant2 } = await createAdminUser();
      const bus1 = await createBus(tenant._id, { busNumber: `BUS-ISO1-${Date.now()}` });
      await createBus(tenant2._id, { busNumber: `BUS-ISO2-${Date.now()}` });

      const res = await request(app)
        .get('/api/v1/buses')
        .set('Authorization', getAuthHeader(adminToken2));

      for (const bus of res.body.data) {
        expect(bus.companyId).toBe(tenant2._id.toString());
      }
    });
  });

  describe('Admin Auth Required', () => {
    it('should require admin role for admin operations', async () => {
      const customerResult = await createTestUser({}, 'customer', tenant);
      const adminOnlyEndpoints = [
        { method: 'post', path: '/api/v1/buses', data: {} },
        { method: 'post', path: '/api/v1/stations', data: {} },
        { method: 'post', path: '/api/v1/routes', data: {} },
        { method: 'delete', path: '/api/v1/trips/someid' },
        { method: 'get', path: '/api/v1/tenants' },
        { method: 'get', path: '/api/v1/analytics/dashboard' },
      ];

      for (const ep of adminOnlyEndpoints) {
        const res = await request(app)
          [ep.method](ep.path)
          .set('Authorization', getAuthHeader(customerResult.token))
          .send(ep.data || {});
        expect(res.status).toBe(403);
      }
    });
  });
});
