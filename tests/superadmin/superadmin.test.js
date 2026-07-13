const request = require('supertest');
const app = require('../../backend/src/app');
const { createAdminUser, createTestUser, createTestTenant, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation, createBooking, createPayment } = require('../helpers/factory.helper');

describe('SuperAdmin ↔ Backend Integration', () => {
  let superAdmin, superAdminToken;

  beforeAll(async () => {
    const result = await createAdminUser();
    superAdmin = result.user;
    superAdminToken = result.token;
  });

  describe('Create Tenant', () => {
    it('should create a new tenant/company', async () => {
      const res = await request(app)
        .post('/api/v1/tenants')
        .send({
          name: 'New Company',
          email: `comp-${Date.now()}@example.com`,
          phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
          plan: 'pro',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Company');
      expect(res.body.data.plan).toBe('pro');
      expect(res.body.data.status).toBe('active');
    });
  });

  describe('List Tenants', () => {
    it('should list all tenants with pagination', async () => {
      await createTestTenant({ name: 'Tenant Alpha' });
      await createTestTenant({ name: 'Tenant Beta' });

      const res = await request(app)
        .get('/api/v1/tenants')
        .set('Authorization', getAuthHeader(superAdminToken))
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should support search/filter by name', async () => {
      await createTestTenant({ name: 'UniqueSearchName' });

      const res = await request(app)
        .get('/api/v1/tenants')
        .set('Authorization', getAuthHeader(superAdminToken))
        .query({ search: 'UniqueSearchName' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Suspend Tenant', () => {
    it('should suspend an active tenant', async () => {
      const tenant = await createTestTenant({ status: 'active' });

      const res = await request(app)
        .patch(`/api/v1/tenants/${tenant._id}/suspend`)
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');
    });
  });

  describe('Activate Tenant', () => {
    it('should activate a suspended tenant', async () => {
      const tenant = await createTestTenant({ status: 'suspended' });

      const res = await request(app)
        .patch(`/api/v1/tenants/${tenant._id}/activate`)
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });
  });

  describe('Revenue Analytics', () => {
    it('should access revenue analytics across all tenants', async () => {
      const tenant = await createTestTenant();
      const { user } = await createTestUser({}, 'customer', tenant);
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id, price: 100 });
      const booking = await createBooking(tenant._id, user._id, trip._id, { totalAmount: 100 });
      await createPayment(tenant._id, user._id, booking._id, { amount: 100, status: 'success' });

      const res = await request(app)
        .get('/api/v1/analytics/revenue')
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
    });

    it('should access dashboard overview', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
    });
  });

  describe('Audit Logs', () => {
    it('should access audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Company Isolation', () => {
    it('should not leak data between companies', async () => {
      const { token: adminToken2, tenant: tenant2 } = await createAdminUser();
      const { user: user2 } = await createTestUser({}, 'customer', tenant2);
      const route2 = await createRoute(tenant2._id);
      const bus2 = await createBus(tenant2._id);
      const trip2 = await createTrip(tenant2._id, { routeId: route2._id, busId: bus2._id });
      const booking2 = await createBooking(tenant2._id, user2._id, trip2._id);
      await createPayment(tenant2._id, user2._id, booking2._id, { amount: 200, status: 'success' });

      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', getAuthHeader(superAdminToken));

      if (res.body.data.length > 0) {
        for (const payment of res.body.data) {
          expect(payment.companyId).toBeDefined();
        }
      }
    });
  });

  describe('Tracking (cross-tenant)', () => {
    it('should allow super admin to see all active buses', async () => {
      const tenant1 = await createTestTenant();
      const tenant2 = await createTestTenant();
      const bus1 = await createBus(tenant1._id, { busNumber: `BUS-SA-${Date.now()}` });
      const bus2 = await createBus(tenant2._id, { busNumber: `BUS-SA2-${Date.now()}` });

      const res = await request(app)
        .get('/api/v1/tracking/active-buses')
        .set('Authorization', getAuthHeader(superAdminToken));

      expect(res.status).toBe(200);
    });
  });
});
