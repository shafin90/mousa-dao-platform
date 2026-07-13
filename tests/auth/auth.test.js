const request = require('supertest');
const app = require('../../backend/src/app');
const User = require('../../backend/src/modules/users/models/User');
const Tenant = require('../../backend/src/modules/tenants/models/Tenant');
const jwt = require('jsonwebtoken');
const { createTestTenant, createTestUser, getAuthHeader } = require('../helpers/auth.helper');
const { createBooking, createTrip, createRoute, createStation, createBus } = require('../helpers/factory.helper');

describe('Auth Module', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a customer with a valid tenant', async () => {
      const tenant = await createTestTenant();
      const payload = {
        name: 'John Doe',
        email: `john-${Date.now()}@example.com`,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'password123',
        role: 'customer',
        companyId: tenant._id.toString(),
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(payload.email.toLowerCase());
      expect(res.body.data.user.role).toBe('customer');

      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      expect(decoded.id).toBeDefined();
      expect(decoded.role).toBe('customer');
    });

    it('should fail registration without companyId (model requires it)', async () => {
      const payload = {
        name: 'No Tenant',
        email: `notenant-${Date.now()}@example.com`,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'password123',
        role: 'customer',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('should register a user with companyId (within a tenant)', async () => {
      const tenant = await createTestTenant();

      const payload = {
        name: 'Jane Doe',
        email: `jane-${Date.now()}@example.com`,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'password123',
        role: 'staff',
        companyId: tenant._id.toString(),
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.companyId).toBe(tenant._id.toString());

      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      expect(decoded.companyId).toBe(tenant._id.toString());
    });

    it('should fail registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Bad', email: 'not-email', phone: '+15550000000', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail registration with short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Bad', email: 'test@test.com', phone: '+15550000000', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail registration when tenant is suspended', async () => {
      const tenant = await createTestTenant({ status: 'suspended' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'User',
          email: `user-${Date.now()}@example.com`,
          phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
          password: 'password123',
          companyId: tenant._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TENANT_SUSPENDED');
    });

    it('should fail registration with duplicate email within same tenant', async () => {
      const tenant = await createTestTenant();
      const email = `dup-${Date.now()}@example.com`;

      await request(app).post('/api/v1/auth/register').send({
        name: 'First',
        email,
        phone: '+15551111111',
        password: 'password123',
        companyId: tenant._id.toString(),
      });

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Second',
        email,
        phone: '+15552222222',
        password: 'password123',
        companyId: tenant._id.toString(),
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const { user } = await createTestUser({ firstName: 'Login', lastName: 'User' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(user.email);

      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user._id.toString());
      expect(decoded.role).toBe(user.role);
    });

    it('should reject login with wrong password', async () => {
      const { user } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(user._id.toString());
      expect(res.body.data.email).toBe(user.email);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with malformed token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011', role: 'customer', companyId: '507f1f77bcf86cd799439011' },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('JWT Token Verification', () => {
    it('should generate token with correct payload shape', async () => {
      const { user, token } = await createTestUser({}, 'admin');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        id: user._id.toString(),
        role: 'admin',
        companyId: user.companyId.toString(),
      });
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should include companyId in token for tenant-scoped users', async () => {
      const tenant = await createTestTenant();
      const { token } = await createTestUser({}, 'staff', tenant);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.companyId).toBe(tenant._id.toString());
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to access admin-only routes', async () => {
      const { token } = await createTestUser({}, 'admin');

      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).not.toBe(403);
    });

    it('should deny customer access to admin-only routes', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow staff access to staff-allowed routes', async () => {
      const { token, tenant } = await createTestUser({}, 'staff');
      const bus = await createBus(tenant._id);
      const route = await createRoute(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
    });

    it('should deny customer access to tenant-admin routes', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .post('/api/v1/buses')
        .set('Authorization', getAuthHeader(token))
        .send({});

      expect(res.status).toBe(403);
    });
  });
});
