const request = require('supertest');
const app = require('../../src/app');
const Booking = require('../../src/modules/bookings/models/Booking');
const Payment = require('../../src/modules/payments/models/Payment');
const Ticket = require('../../src/modules/tickets/models/Ticket');
const ProcessedPaymentEvent = require('../../src/modules/payments/models/ProcessedPaymentEvent');
const Audit = require('../../src/modules/audit/audit.model');
const { createTestUser } = require('../helpers/auth.helper');
const { setupTestRouteAndTrip } = require('../helpers/booking.helper');
const { getMockChannel } = require('../helpers/queue.helper');
const { PAYMENT_WEBHOOK_QUEUE } = require('../../src/queue/queues');

const { startBookingConsumer } = require('../../src/consumers/booking.consumer');
const { startPaymentConsumer } = require('../../src/consumers/payment.consumer');
const { startWebhookConsumer } = require('../../src/consumers/payment-webhook.consumer');
const { startTicketConsumer } = require('../../src/consumers/ticket.consumer');

/**
 * Poll DB until condition is truthy or timeout expires.
 * @param {Function} fn - async function returning a truthy value when done
 * @param {number} timeoutMs
 * @param {number} intervalMs
 */
const waitForCondition = async (fn, timeoutMs = 8000, intervalMs = 100) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result) return result;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`waitForCondition timed out after ${timeoutMs}ms`);
};

describe('End-to-End System Integration Test', () => {
  let adminToken;
  let customerToken;
  let customerUser;
  let trip;
  const webhookSecret = process.env.FLW_WEBHOOK_SECRET || 'test-webhook-secret';

  beforeEach(async () => {
    // 1. Setup Auth
    const admin = await createTestUser({}, 'admin');
    adminToken = admin.token;

    const customer = await createTestUser({}, 'customer');
    customerToken = customer.token;
    customerUser = customer.user;

    // 2. Setup Route & Trip
    const data = await setupTestRouteAndTrip(40);
    trip = data.trip;

    // 3. Start all RabbitMQ Consumers (in-memory mock)
    await startBookingConsumer();
    await startPaymentConsumer();
    await startWebhookConsumer();
    await startTicketConsumer();
  });

  it('should process booking -> payment queue -> webhook verification -> ticket generation end-to-end', async () => {
    // -- PHASE 1: Create Booking --
    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        tripId: trip._id.toString(),
        seats: ['10', '11']
      });

    expect(bookingRes.status).toBe(202);

    // Wait for booking consumer to process and write booking to DB
    const bookingRecord = await waitForCondition(async () => {
      return await Booking.findOne({ userId: customerUser._id, tripId: trip._id });
    });
    expect(bookingRecord).toBeDefined();
    const bookingId = bookingRecord._id.toString();

    // -- PHASE 2: Initiate Payment --
    // Mock Flutterwave API for payment initialization
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'Hosted link generated',
          data: { link: 'https://checkout.flutterwave.com/v3/hosted/pay/test-link' }
        })
      });

    const payRes = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId,
        method: 'flutterwave'
      });

    expect(payRes.status).toBe(202);
    const { tx_ref } = payRes.body.data;

    // Wait for payment consumer to process and create Payment record with status=processing
    const paymentRecord = await waitForCondition(async () => {
      const p = await Payment.findOne({ tx_ref });
      return p && p.status === 'processing' ? p : null;
    });
    expect(paymentRecord).toBeDefined();
    expect(paymentRecord.paymentLink).toBe('https://checkout.flutterwave.com/v3/hosted/pay/test-link');

    // -- PHASE 3: Trigger Webhook Success --
    // Mock Flutterwave API for transaction verification
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          message: 'Tx fetched',
          data: {
            status: 'successful',
            amount: 100,
            currency: 'XOF',
            tx_ref,
            id: 987654
          }
        })
      });

    const webhookPayload = {
      event: 'charge.completed',
      data: {
        id: 987654,
        tx_ref,
        amount: 100,
        currency: 'XOF',
        status: 'successful'
      }
    };

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook')
      .set('verif-hash', webhookSecret)
      .send(webhookPayload);

    expect(webhookRes.status).toBe(202);

    // -- PHASE 4: Wait for DB state to reflect end-to-end processing --
    // Wait for booking to be confirmed and paid
    const finalBooking = await waitForCondition(async () => {
      const b = await Booking.findById(bookingId);
      return b && b.status === 'confirmed' ? b : null;
    });
    expect(finalBooking.status).toBe('confirmed');
    expect(finalBooking.paymentStatus).toBe('paid');

    // Wait for payment to reach success state
    const finalPayment = await waitForCondition(async () => {
      const p = await Payment.findOne({ tx_ref });
      return p && p.status === 'success' ? p : null;
    });
    expect(finalPayment.status).toBe('success');
    expect(finalPayment.transactionId).toBe('987654');

    // Wait for ticket to be generated
    const ticket = await waitForCondition(async () => {
      return await Ticket.findOne({ bookingId });
    });
    expect(ticket).toBeDefined();
    expect(ticket.status).toBe('valid');
    expect(ticket.ticketNumber).toBeDefined();
    expect(ticket.qrCode).toBeDefined();

    // -- PHASE 5: Idempotency check — duplicate webhook --
    const duplicateWebhookRes = await request(app)
      .post('/api/v1/payments/webhook')
      .set('verif-hash', webhookSecret)
      .send(webhookPayload);

    expect(duplicateWebhookRes.status).toBe(202);

    // The duplicate should be blocked by idempotency (ProcessedPaymentEvent unique index)
    // Wait for the audit log to appear
    const duplicateLogs = await waitForCondition(async () => {
      const logs = await Audit.find({ action: 'DUPLICATE_WEBHOOK_BLOCKED' });
      return logs.length > 0 ? logs : null;
    });
    expect(duplicateLogs.length).toBe(1);

    // Verify audit log for payment success exists
    const successLogs = await Audit.find({ action: 'PAYMENT_SUCCESS' });
    expect(successLogs.length).toBe(1);
  });
});
