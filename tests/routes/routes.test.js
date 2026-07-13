const request = require('supertest');
const app = require('../../backend/src/app');
const { createAdminUser, createTestUser, getAuthHeader } = require('../helpers/auth.helper');
const { createRoute, createStation } = require('../helpers/factory.helper');

describe('Routes API', () => {
  describe('GET /api/v1/routes', () => {
    it('should list routes for tenant', async () => {
      const { token, tenant } = await createAdminUser();
      const from = await createStation(tenant._id, { name: 'Cairo' });
      const to = await createStation(tenant._id, { name: 'Alex' });

      const res = await request(app)
        .get('/api/v1/routes')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/routes', () => {
    it('should create a route as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const from = await createStation(tenant._id, { name: 'From Station' });
      const to = await createStation(tenant._id, { name: 'To Station' });

      const res = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', getAuthHeader(token))
        .send({
          fromStation: from._id.toString(),
          toStation: to._id.toString(),
          baseFare: 100,
          distanceKm: 220,
          estimatedTimeMinutes: 240,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.baseFare).toBe(100);
    });

    it('should reject route creation by non-admin', async () => {
      const { token } = await createTestUser({}, 'staff');

      const res = await request(app)
        .post('/api/v1/routes')
        .set('Authorization', getAuthHeader(token))
        .send({});

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/routes/:id', () => {
    it('should get route by id', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id);

      const res = await request(app)
        .get(`/api/v1/routes/${route._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(route._id.toString());
    });
  });

  describe('PATCH /api/v1/routes/:id', () => {
    it('should update route as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id, { baseFare: 50 });

      const res = await request(app)
        .patch(`/api/v1/routes/${route._id}`)
        .set('Authorization', getAuthHeader(token))
        .send({ baseFare: 75 });

      expect(res.status).toBe(200);
      expect(res.body.data.baseFare).toBe(75);
    });
  });

  describe('DELETE /api/v1/routes/:id', () => {
    it('should delete route as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const route = await createRoute(tenant._id);

      const res = await request(app)
        .delete(`/api/v1/routes/${route._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
    });
  });
});
