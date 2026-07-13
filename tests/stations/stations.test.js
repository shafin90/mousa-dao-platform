const request = require('supertest');
const app = require('../../backend/src/app');
const { createTestTenant, createAdminUser, createTestUser, getAuthHeader } = require('../helpers/auth.helper');
const { createStation, createCity } = require('../helpers/factory.helper');
const Station = require('../../backend/src/modules/stations/models/Station');

describe('Stations API', () => {
  describe('GET /api/v1/stations', () => {
    it('should list all stations for the tenant', async () => {
      const { user, token, tenant } = await createAdminUser();
      await createStation(tenant._id, { name: 'Cairo Station' });
      await createStation(tenant._id, { name: 'Alex Station' });

      const res = await request(app)
        .get('/api/v1/stations')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should enforce tenant isolation', async () => {
      const { token: token1, tenant: tenant1 } = await createAdminUser();
      const { token: token2, tenant: tenant2 } = await createAdminUser();
      await createStation(tenant1._id, { name: 'Tenant1 Station' });

      const res = await request(app)
        .get('/api/v1/stations')
        .set('Authorization', getAuthHeader(token2));

      expect(res.body.data.length).toBe(0);
    });
  });

  describe('POST /api/v1/stations', () => {
    it('should create a station as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const city = await createCity(tenant._id);

      const res = await request(app)
        .post('/api/v1/stations')
        .set('Authorization', getAuthHeader(token))
        .send({
          name: 'New Station',
          cityId: city._id.toString(),
          address: '123 Main St',
          location: { lat: 30.04, lng: 31.23 },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Station');
      expect(res.body.data.location.lat).toBe(30.04);
    });

    it('should reject station creation by customer', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .post('/api/v1/stations')
        .set('Authorization', getAuthHeader(token))
        .send({ name: 'Test' });

      expect(res.status).toBe(403);
    });

    it('should reject station with missing location', async () => {
      const { token } = await createAdminUser();

      const res = await request(app)
        .post('/api/v1/stations')
        .set('Authorization', getAuthHeader(token))
        .send({ name: 'Incomplete Station' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/stations/:id', () => {
    it('should get station by id', async () => {
      const { token, tenant } = await createAdminUser();
      const station = await createStation(tenant._id, { name: 'Test Station' });

      const res = await request(app)
        .get(`/api/v1/stations/${station._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Test Station');
    });

    it('should return 404 for non-existent station', async () => {
      const { token } = await createAdminUser();
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .get(`/api/v1/stations/${fakeId}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/stations/:id', () => {
    it('should update station as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const station = await createStation(tenant._id, { name: 'Old Name' });

      const res = await request(app)
        .patch(`/api/v1/stations/${station._id}`)
        .set('Authorization', getAuthHeader(token))
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/v1/stations/:id', () => {
    it('should delete station as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const station = await createStation(tenant._id);

      const res = await request(app)
        .delete(`/api/v1/stations/${station._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);

      const check = await Station.findById(station._id);
      expect(check).toBeNull();
    });
  });

  describe('GET /api/v1/stations/distance', () => {
    it('should return distance between two stations', async () => {
      const { token, tenant } = await createAdminUser();
      const from = await createStation(tenant._id, { name: 'Station A', lat: 30.0, lng: 31.0 });
      const to = await createStation(tenant._id, { name: 'Station B', lat: 31.0, lng: 32.0 });

      const res = await request(app)
        .get('/api/v1/stations/distance')
        .query({ from: from._id.toString(), to: to._id.toString() })
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.distanceKm).toBeDefined();
      expect(typeof res.body.data.distanceKm).toBe('number');
    });

    it('should return 400 if from/to missing', async () => {
      const { token } = await createAdminUser();

      const res = await request(app)
        .get('/api/v1/stations/distance')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(400);
    });
  });
});
