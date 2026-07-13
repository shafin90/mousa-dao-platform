const request = require('supertest');
const app = require('../../backend/src/app');
const { createAdminUser, createTestUser, createDriverUser, getAuthHeader } = require('../helpers/auth.helper');
const { createBus } = require('../helpers/factory.helper');

describe('Buses API', () => {
  describe('GET /api/v1/buses', () => {
    it('should list buses for tenant', async () => {
      const { token, tenant } = await createAdminUser();
      await createBus(tenant._id, { busNumber: 'BUS-001', name: 'Bus 1' });
      await createBus(tenant._id, { busNumber: 'BUS-002', name: 'Bus 2' });

      const res = await request(app)
        .get('/api/v1/buses')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should allow customers to list buses', async () => {
      const { token, tenant } = await createTestUser({}, 'customer');
      await createBus(tenant._id);

      const res = await request(app)
        .get('/api/v1/buses')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/buses', () => {
    it('should create a bus as admin', async () => {
      const { token } = await createAdminUser();

      const res = await request(app)
        .post('/api/v1/buses')
        .set('Authorization', getAuthHeader(token))
        .send({
          busNumber: `BUS-NEW-${Date.now()}`,
          name: 'New Bus',
          capacity: 50,
          type: 'VIP',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.busNumber).toBeDefined();
      expect(res.body.data.capacity).toBe(50);
    });

    it('should reject bus creation by customer', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .post('/api/v1/buses')
        .set('Authorization', getAuthHeader(token))
        .send({ busNumber: 'BUS-X', name: 'X', capacity: 40, type: 'AC' });

      expect(res.status).toBe(403);
    });

    it('should reject bus with missing fields', async () => {
      const { token } = await createAdminUser();

      const res = await request(app)
        .post('/api/v1/buses')
        .set('Authorization', getAuthHeader(token))
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate bus number within tenant', async () => {
      const { token, tenant } = await createAdminUser();
      const busNum = `DUP-${Date.now()}`;
      await createBus(tenant._id, { busNumber: busNum });

      const res = await request(app)
        .post('/api/v1/buses')
        .set('Authorization', getAuthHeader(token))
        .send({ busNumber: busNum, name: 'Duplicate', capacity: 40, type: 'AC' });

      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/v1/buses/:id/status', () => {
    it('should update bus status as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const bus = await createBus(tenant._id, { busNumber: 'BUS-STATUS', status: 'active' });

      const res = await request(app)
        .patch(`/api/v1/buses/${bus._id}/status`)
        .set('Authorization', getAuthHeader(token))
        .send({ status: 'maintenance' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('maintenance');
    });
  });

  describe('PATCH /api/v1/buses/:id/assign-driver', () => {
    it('should assign driver to bus', async () => {
      const { token, tenant } = await createAdminUser();
      const bus = await createBus(tenant._id, { busNumber: 'BUS-DRIVER' });
      const { user: driver } = await createDriverUser(tenant);

      const res = await request(app)
        .patch(`/api/v1/buses/${bus._id}/assign-driver`)
        .set('Authorization', getAuthHeader(token))
        .send({ driverId: driver._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedDriver.toString()).toBe(driver._id.toString());
    });
  });

  describe('DELETE /api/v1/buses/:id', () => {
    it('should delete bus as admin', async () => {
      const { token, tenant } = await createAdminUser();
      const bus = await createBus(tenant._id);

      const res = await request(app)
        .delete(`/api/v1/buses/${bus._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
    });
  });
});
