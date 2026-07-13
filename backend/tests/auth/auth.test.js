const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/modules/users/models/User');
const jwt = require('jsonwebtoken');
const { createTestUser } = require('../helpers/auth.helper');

describe('Authentication & RBAC Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with valid data', async () => {
      const payload = {
        name: 'John Doe',
        email: `john-${Date.now()}@example.com`,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'password123',
        role: 'customer'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(payload.email.toLowerCase());
    });

    it('should fail registration with invalid email format', async () => {
      const payload = {
        name: 'Invalid User',
        email: 'invalid-email',
        phone: '+1555000000',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail registration if email already exists', async () => {
      const email = `existing-${Date.now()}@example.com`;
      await User.create({
        email,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'hashedpassword',
        profile: { firstName: 'Exist', lastName: 'User' }
      });

      const payload = {
        name: 'Duplicate Email',
        email,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const email = `login-${Date.now()}@example.com`;
      const plainPassword = 'password123';
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      await User.create({
        email,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: hashedPassword,
        profile: { firstName: 'Login', lastName: 'User' }
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: plainPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const email = `login-${Date.now()}@example.com`;
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);

      await User.create({
        email,
        phone: `+1555${Math.floor(100000 + Math.random() * 900000)}`,
        password: hashedPassword,
        profile: { firstName: 'Login', lastName: 'User' }
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me (Protected)', () => {
    it('should return user profile if authorization header is valid', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(user._id.toString());
    });

    it('should return 401 if token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign(
        { _id: '507f1f77bcf86cd799439011', role: 'customer' },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('RBAC Authorization', () => {
    it('should allow admin to access admin routes', async () => {
      const { token } = await createTestUser({}, 'admin');
      
      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).not.toBe(403);
    });

    it('should deny customer access to admin routes', async () => {
      const { token } = await createTestUser({}, 'customer');
      
      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
