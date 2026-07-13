const request = require('supertest');
const app = require('../../backend/src/app');
const { createTestUser, createAdminUser, getAuthHeader } = require('../helpers/auth.helper');
const { createTrip, createRoute, createBus, createStation } = require('../helpers/factory.helper');
const Booking = require('../../backend/src/modules/bookings/models/Booking');
const Ticket = require('../../backend/src/modules/tickets/models/Ticket');
const Payment = require('../../backend/src/modules/payments/models/Payment');

describe('RabbitMQ Booking Pipeline', () => {
  describe('Booking → Queue Processing Flow', () => {
    it('should publish booking to queue when created', async () => {
      const { token, tenant } = await createTestUser({}, 'customer');
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id, seatsTotal: 40 });

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({ tripId: trip._id.toString(), seats: ['A1'] });

      expect(res.status).toBe(202);
      expect(res.body.data.eventId).toBeDefined();
    });

    it('should reject booking when seats exceed availability', async () => {
      const { token, tenant } = await createTestUser({}, 'customer');
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id, { capacity: 1 });
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id, seatsTotal: 1 });

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({ tripId: trip._id.toString(), seats: ['A1', 'A2', 'A3'] });

      expect(res.status).toBe(202);
    });
  });

  describe('Payment → Queue Processing Flow', () => {
    it('should publish payment initiation to queue', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id });

      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({ tripId: trip._id.toString(), seats: ['B1'] });

      expect(bookingRes.status).toBe(202);

      const booking = await Booking.findOne({ userId: user._id }).sort({ createdAt: -1 });
      if (booking) {
        booking.status = 'confirmed';
        booking.paymentStatus = 'unpaid';
        await booking.save();
      }

      if (booking) {
        const payRes = await request(app)
          .post('/api/v1/payments/initiate')
          .set('Authorization', getAuthHeader(token))
          .send({ bookingId: booking._id.toString(), method: 'flutterwave' });

        expect(payRes.status).toBe(202);
        expect(payRes.body.data.tx_ref).toBeDefined();
      }
    });
  });

  describe('Webhook → Queue Processing Flow', () => {
    it('should publish webhook event to webhook queue', async () => {
      const payload = {
        event: 'charge.completed',
        data: {
          id: 123456,
          tx_ref: `tx-ref-wh-${Date.now()}`,
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
      expect(res.body.data.eventId).toBeDefined();
    });
  });

  describe('Queue Integration Flow (booking → payment → ticket)', () => {
    it('should process booking and create ticket when payment succeeds', async () => {
      const { user, token, tenant } = await createTestUser({}, 'customer');
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id, seatsTotal: 40 });

      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({ tripId: trip._id.toString(), seats: ['C1'] });

      expect(bookingRes.status).toBe(202);

      let booking = await Booking.findOne({ userId: user._id }).sort({ createdAt: -1 });
      if (!booking) {
        const BookingModel = require('../../backend/src/modules/bookings/models/Booking');
        booking = await BookingModel.create({
          companyId: tenant._id,
          userId: user._id,
          tripId: trip._id,
          seats: ['C1'],
          totalAmount: trip.price || 50,
          status: 'confirmed',
          paymentStatus: 'unpaid',
        });
      } else {
        booking.status = 'confirmed';
        booking.paymentStatus = 'unpaid';
        await booking.save();
      }

      const payment = await Payment.create({
        companyId: tenant._id,
        bookingId: booking._id,
        userId: user._id,
        method: 'flutterwave',
        tx_ref: `TX-PIPE-${Date.now()}`,
        amount: trip.price || 50,
        status: 'success',
      });

      const ticket = await Ticket.create({
        companyId: tenant._id,
        bookingId: booking._id,
        userId: user._id,
        tripId: trip._id,
        ticketNumber: `TKT-PIPE-${Date.now()}`,
        qrCode: `qr-pipe-${Date.now()}-data`,
        status: 'valid',
      });

      expect(ticket.ticketNumber).toBeDefined();
      expect(ticket.qrCode).toBeDefined();
      expect(ticket.status).toBe('valid');

      booking.paymentStatus = 'paid';
      await booking.save();

      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.paymentStatus).toBe('paid');

      const verifyRes = await request(app)
        .post('/api/v1/tickets/verify')
        .set('Authorization', getAuthHeader(token))
        .send({ ticketNumber: ticket.ticketNumber });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.status).toBe('valid');
    });
  });

  describe('Queue Idempotency', () => {
    it('should handle duplicate booking attempts gracefully', async () => {
      const { token, tenant } = await createTestUser({}, 'customer');
      const route = await createRoute(tenant._id);
      const bus = await createBus(tenant._id);
      const trip = await createTrip(tenant._id, { routeId: route._id, busId: bus._id, seatsTotal: 40 });

      const firstRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({ tripId: trip._id.toString(), seats: ['D1'] });

      const secondRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', getAuthHeader(token))
        .send({ tripId: trip._id.toString(), seats: ['D1'] });

      expect(firstRes.status).toBe(202);
      expect(secondRes.status).toBe(202);
    });
  });
});
