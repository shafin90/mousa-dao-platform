const request = require('supertest');
const app = require('../../backend/src/app');
const { createTestUser, createAdminUser, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation, createBooking, createPayment } = require('../helpers/factory.helper');

describe('Payments API', () => {
  describe('POST /api/v1/payments/initiate', () => {
    it('should queue a payment initiation', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id, { status: 'confirmed', paymentStatus: 'unpaid' });

      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', getAuthHeader(token))
        .send({ bookingId: booking._id.toString(), method: 'flutterwave' });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eventId).toBeDefined();
      expect(res.body.data.tx_ref).toBeDefined();
    });

    it('should reject payment without bookingId', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', getAuthHeader(token))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should accept valid webhook with correct signature', async () => {
      const payload = {
        event: 'charge.completed',
        data: {
          id: 998877,
          tx_ref: 'tx-ref-webhook-test',
          amount: 100,
          currency: 'XOF',
          status: 'successful',
        },
      };

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('verif-hash', process.env.FLW_WEBHOOK_SECRET || 'test-webhook-secret')
        .send(payload);

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eventId).toBeDefined();
    });

    it('should reject webhook with invalid signature', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('verif-hash', 'wrong-signature')
        .send({ event: 'test', data: {} });

      expect(res.status).toBe(401);
    });

    it('should reject webhook with missing signature header', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ event: 'test', data: {} });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/payments/my', () => {
    it('should return current user payments', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      await createPayment(tenant._id, user._id, booking._id);

      const res = await request(app)
        .get('/api/v1/payments/my')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/v1/payments (admin)', () => {
    it('should return all payments for admin', async () => {
      const { user, token, tenant } = await createAdminUser();
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      await createPayment(tenant._id, user._id, booking._id);

      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should deny customers from listing all payments', async () => {
      const { token } = await createTestUser({}, 'customer');

      const res = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    it('should get own payment by id', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      const payment = await createPayment(tenant._id, user._id, booking._id);

      const res = await request(app)
        .get(`/api/v1/payments/${payment._id}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(payment._id.toString());
    });

    it('should get payment by tx_ref', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const trip = await createTrip(tenant._id);
      const booking = await createBooking(tenant._id, user._id, trip._id);
      const payment = await createPayment(tenant._id, user._id, booking._id, { tx_ref: `TX-REF-${Date.now()}` });

      const res = await request(app)
        .get(`/api/v1/payments/${payment.tx_ref}`)
        .set('Authorization', getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.tx_ref).toBe(payment.tx_ref);
    });
  });
});
