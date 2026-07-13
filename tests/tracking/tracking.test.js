const request = require('supertest');
const app = require('../../backend/src/app');
const { createAdminUser, createTestUser, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation, createBusLocation } = require('../helpers/factory.helper');

describe('Tracking / GPS API', () => {
  describe('GET /api/v1/tracking/active-buses', () => {
    it('should return active bus locations for admin', async () => {
      const { token, tenant } = await createAdminUser();
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { busId: bus._id });
      await createBusLocation(tenant._id, bus._id, trip._id, { latitude: 30.04, longitude: 31.23 });

      const res = await request(app)
        .get('/api/v1/tracking/active-buses')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny active-buses for non-admin', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .get('/api/v1/tracking/active-buses')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/tracking/live/:tripId', () => {
    it('should return live location for a trip', async () => {
      const { token, tenant } = await createAdminUser();
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { busId: bus._id });
      await createBusLocation(tenant._id, bus._id, trip._id);

      const res = await request(app)
        .get(`/api/v1/tracking/live/${trip._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should return 404 if no location data', async () => {
      const { token, tenant } = await createAdminUser();
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { busId: bus._id });

      const res = await request(app)
        .get(`/api/v1/tracking/live/${trip._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/tracking/bus/:busId', () => {
    it('should return bus location (Redis-first)', async () => {
      const { token, tenant } = await createAdminUser();
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { busId: bus._id });
      await createBusLocation(tenant._id, bus._id, trip._id);

      const res = await request(app)
        .get(`/api/v1/tracking/bus/${bus._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Tenant Isolation', () => {
    it('should isolate GPS data between tenants', async () => {
      const { token: token1, tenant: tenant1 } = await createAdminUser();
      const { token: token2, tenant: tenant2 } = await createAdminUser();
      const bus1 = await createBus(tenant1._id);
      const bus2 = await createBus(tenant2._id);
      const trip1 = await createTrip(tenant1._id, { busId: bus1._id });
      const trip2 = await createTrip(tenant2._id, { busId: bus2._id });
      await createBusLocation(tenant1._id, bus1._id, trip1._id);

      const res = await request(app)
        .get('/api/v1/tracking/active-buses')
        .set('Authorization', getAuthHeader(token2));

      expect(res.body.data.length).toBe(0);
    });
  });
});
