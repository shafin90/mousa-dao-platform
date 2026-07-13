const request = require('supertest');
const app = require('../../src/app');
const Booking = require('../../src/modules/bookings/models/Booking');
const Trip = require('../../src/modules/trips/models/Trip');
const { createTestUser } = require('../helpers/auth.helper');
const { setupTestRouteAndTrip } = require('../helpers/booking.helper');
const { getMockChannel, waitForMessage } = require('../helpers/queue.helper');
const { startBookingConsumer } = require('../../src/consumers/booking.consumer');

describe('Bookings Module Tests', () => {
  let customerToken;
  let user;
  let trip;

  beforeEach(async () => {
    const customer = await createTestUser({}, 'customer');
    customerToken = customer.token;
    user = customer.user;

    const data = await setupTestRouteAndTrip(40);
    trip = data.trip;

    await startBookingConsumer();
  });

  describe('POST /api/v1/bookings', () => {
    it('should queue a booking successfully and process it', async () => {
      const channel = getMockChannel();
      const messagePromise = waitForMessage(channel, 'ack');

      const payload = {
        tripId: trip._id.toString(),
        seats: ['1', '2']
      };

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.eventId).toBeDefined();

      // Wait for consumer to process
      await messagePromise;

      // Verify booking created in DB
      const booking = await Booking.findOne({ userId: user._id, tripId: trip._id });
      expect(booking).toBeDefined();
      expect(booking.seats).toEqual(payload.seats);
      expect(booking.status).toBe('pending');

      const updatedTrip = await Trip.findById(trip._id);
      expect(updatedTrip.seatsBooked).toBe(2);
    });

    it('should fail booking consumer processing if seats are already booked', async () => {
      // Seed an existing booking
      await Booking.create({
        userId: user._id,
        tripId: trip._id,
        seats: ['1', '2'],
        totalAmount: 100,
        status: 'pending'
      });
      trip.seatsBooked = 2;
      await trip.save();

      const channel = getMockChannel();
      const messagePromise = waitForMessage(channel, 'nack');

      const payload = {
        tripId: trip._id.toString(),
        seats: ['2', '3'] // '2' is duplicate
      };

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(res.status).toBe(202);

      // Wait for consumer to nack the message
      await messagePromise;

      // Verify no new booking created for this second request
      const bookingsCount = await Booking.countDocuments({ seats: '3' });
      expect(bookingsCount).toBe(0);
    });

    it('should fail booking consumer processing if seats requested exceed remaining capacity', async () => {
      trip.seatsBooked = 39;
      await trip.save();

      const channel = getMockChannel();
      const messagePromise = waitForMessage(channel, 'nack');

      const payload = {
        tripId: trip._id.toString(),
        seats: ['40', '41'] // exceeds capacity
      };

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(res.status).toBe(202);

      await messagePromise;

      const bookingsCount = await Booking.countDocuments({ userId: user._id, seats: '40' });
      expect(bookingsCount).toBe(0);
    });
  });

  describe('PATCH /api/v1/bookings/:id/cancel', () => {
    it('should cancel a booking and release seats', async () => {
      const booking = await Booking.create({
        userId: user._id,
        tripId: trip._id,
        seats: ['1', '2'],
        totalAmount: 100,
        status: 'pending'
      });
      trip.seatsBooked = 2;
      await trip.save();

      const res = await request(app)
        .patch(`/api/v1/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');

      const updatedTrip = await Trip.findById(trip._id);
      expect(updatedTrip.seatsBooked).toBe(0);
    });
  });
});
