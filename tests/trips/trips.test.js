const request = require('supertest');
const app = require('../../backend/src/app');
const { createAdminUser, createTestUser, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation } = require('../helpers/factory.helper');

describe('Trips API', () => {
  describe('GET /api/v1/trips', () => {
    it('should list trips for tenant', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      await createTrip(tenant._id, { routeId: route._id, busId: bus._id, date: new Date(Date.now() + 86400000) });
      await createTrip(tenant._id, { routeId: route._id, busId: bus._id, date: new Date(Date.now() + 172800000) });

      const res = await request(app)
        .get('/api/v1/trips')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should allow customers to list trips', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .get('/api/v1/trips')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/trips', () => {
    it('should create a trip as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id, { capacity: 40 });

      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', getAuthHeader(token))
        .send({
          routeId: route._id.toString(),
          busId: bus._id.toString(),
          departureTime: '08:00',
          arrivalTime: '12:00',
          date: new Date(Date.now() + 86400000).toISOString(),
          price: 50,
          seatsTotal: 40,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.price).toBe(50);
    });

    it('should allow staff to create trips', async () => {
      const { token, tenant } = await createTestUser({}, 'staff');
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id, { capacity: 40 });

      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', getAuthHeader(token))
        .send({
          routeId: route._id.toString(),
          busId: bus._id.toString(),
          departureTime: '10:00',
          arrivalTime: '14:00',
          date: new Date(Date.now() + 86400000).toISOString(),
          price: 60,
          seatsTotal: 40,
        });

      expect(res.status).toBe(201);
    });

    it('should reject trip creation by customer', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', getAuthHeader(token))
        .send({});

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/trips/:id', () => {
    it('should get trip details with populated references', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(trip._id.toString());
    });

    it('should return 404 for non-existent trip', async () => {
      const { token } = await createAdminUser();

      const res = await request(app)
        .get('/api/v1/trips/507f1f77bcf86cd799439011')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/trips/:id/status', () => {
    it('should update trip status', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id });

      const res = await request(app)
        .patch(`/api/v1/trips/${trip._id}/status`)
        .set('Authorization', getAuthHeader(token))
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });
  });

  describe('DELETE /api/v1/trips/:id', () => {
    it('should delete trip as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id });

      const res = await request(app)
        .delete(`/api/v1/trips/${trip._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
    });

    it('should reject delete by staff', async () => {
      const { token, tenant } = await createTestUser({}, 'staff');
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id });

      const res = await request(app)
        .delete(`/api/v1/trips/${trip._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(403);
    });
  });
});
