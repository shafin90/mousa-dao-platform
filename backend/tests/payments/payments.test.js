const request = require('supertest');
const app = require('../../src/app');
const Booking = require('../../src/modules/bookings/models/Booking');
const Payment = require('../../src/modules/payments/models/Payment');
const { createTestUser } = require('../helpers/auth.helper');
const { setupTestRouteAndTrip, createTestBooking } = require('../helpers/booking.helper');
const { getMockChannel, waitForMessage } = require('../helpers/queue.helper');

const { PAYMENT_QUEUE } = require('../../src/queue/queues');

describe('Payments Module Tests', () => {
  let customerToken;
  let user;
  let trip;
  let booking;

  beforeEach(async () => {
    const customer = await createTestUser({}, 'customer');
    customerToken = customer.token;
    user = customer.user;

    const data = await setupTestRouteAndTrip(40);
    trip = data.trip;

    booking = await createTestBooking(user._id, trip._id, ['1A']);
  });

  describe('POST /api/v1/payments/initiate', () => {
    it('should queue a payment initiation request and publish to queue', async () => {
      const channel = getMockChannel();

      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id.toString(),
          method: 'flutterwave'
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tx_ref).toBeDefined();
      expect(res.body.data.eventId).toBeDefined();

      const queuesList = channel.queues.get(PAYMENT_QUEUE) || [];
      expect(queuesList.length).toBe(1);
      const event = JSON.parse(queuesList[0].content.toString());
      expect(event.eventType).toBe('INITIATE_PAYMENT');
      expect(event.bookingId).toBe(booking._id.toString());
      expect(event.userId).toBe(user._id.toString());
      expect(event.method).toBe('flutterwave');
    });

    it('should reject payment initiation with invalid parameters', async () => {
      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: 'invalid-id',
          method: 'unsupported-method'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/payments/my', () => {
    it('should retrieve payment history for the user', async () => {
      await Payment.create({
        bookingId: booking._id,
        userId: user._id,
        method: 'flutterwave',
        tx_ref: 'tx-ref-123',
        status: 'pending'
      });

      const res = await request(app)
        .get('/api/v1/payments/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].tx_ref).toBe('tx-ref-123');
    });
  });
});
