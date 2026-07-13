const request = require('supertest');
const app = require('../../backend/src/app');
const { createTestTenant, createAdminUser, createTestUser, getAuthHeader } = require('../helpers/auth.helper');
const Tenant = require('../../backend/src/modules/tenants/models/Tenant');

describe('Tenants API', () => {
  describe('POST /api/v1/tenants (public)', () => {
    it('should create a tenant publicly (no auth required)', async () => {
      const res = await request(app)
        .post('/api/v1/tenants')
        .send({
          name: 'New Transport Co',
          email: `newco-${Date.now()}@example.com`,
          phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Transport Co');
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.plan).toBe('basic');
    });

    it('should reject tenant with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/tenants')
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/tenants (admin only)', () => {
    it('should list tenants as admin', async () => {
      const { token } = await createAdminUser();
      await createTestTenant({ name: 'Tenant A' });
      await createTestTenant({ name: 'Tenant B' });

      const res = await request(app)
        .get('/api/v1/tenants')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
    });

    it('should deny tenants list for non-admin', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .get('/api/v1/tenants')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/tenants/:id/suspend', () => {
    it('should suspend a tenant as admin', async () => {
      const { token } = await createAdminUser();
      const tenant = await createTestTenant();

      const res = await request(app)
        .patch(`/api/v1/tenants/${tenant._id}/suspend`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');
    });
  });

  describe('PATCH /api/v1/tenants/:id/activate', () => {
    it('should activate a suspended tenant', async () => {
      const { token } = await createAdminUser();
      const tenant = await createTestTenant({ status: 'suspended' });

      const res = await request(app)
        .patch(`/api/v1/tenants/${tenant._id}/activate`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });
  });

  describe('GET /api/v1/tenants/:id', () => {
    it('should get tenant by id as admin', async () => {
      const { token } = await createAdminUser();
      const tenant = await createTestTenant();

      const res = await request(app)
        .get(`/api/v1/tenants/${tenant._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(tenant._id.toString());
    });
  });

  describe('PATCH /api/v1/tenants/:id', () => {
    it('should update tenant as admin', async () => {
      const { token } = await createAdminUser();
      const tenant = await createTestTenant();

      const res = await request(app)
        .patch(`/api/v1/tenants/${tenant._id}`)
        .set('Authorization', getAuthHeader(token))
        .send({ name: 'Updated Co Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Co Name');
    });
  });

  describe('Suspended Tenant Isolation', () => {
    it('should prevent login when tenant is suspended', async () => {
      const { token: adminToken } = await createAdminUser();
      const tenant = await createTestTenant({ status: 'active' });

      const registerRes = await request(app).post('/api/v1/auth/register').send({
        name: 'User in Suspendable',
        email: `suspend-me-${Date.now()}@example.com`,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'password123',
        companyId: tenant._id.toString(),
      });
      const userEmail = registerRes.body.data.user.email;

      await request(app)
        .patch(`/api/v1/tenants/${tenant._id}/suspend`)
        .set('Authorization', getAuthHeader(adminToken));

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userEmail, password: 'password123' });

      expect(loginRes.status).toBe(401);
    });
  });
});
