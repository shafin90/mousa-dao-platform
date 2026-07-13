const request = require('supertest');
const app = require('../../src/app');
const Booking = require('../../src/modules/bookings/models/Booking');
const Trip = require('../../src/modules/trips/models/Trip');
const { createTestUser } = require('../helpers/auth.helper');
const { setupTestRouteAndTrip } = require('../helpers/booking.helper');
const { getMockChannel } = require('../helpers/queue.helper');
const { startBookingConsumer } = require('../../src/consumers/booking.consumer');

describe('Concurrency & Race Condition Tests', () => {
  let trip;
  const userTokens = [];

  beforeEach(async () => {
    // Generate trip with 5 capacity
    const data = await setupTestRouteAndTrip(5);
    trip = data.trip;

    // Create 20 users (keep below rate-limit threshold for test reliability)
    userTokens.length = 0;
    for (let i = 0; i < 20; i++) {
      const { token } = await createTestUser();
      userTokens.push(token);
    }

    await startBookingConsumer();
  });

  it('should prevent overbooking and allocate seat exactly once under high concurrency', async () => {
    const seatToBook = ['3A'];
    const channel = getMockChannel();

    // 20 concurrent users try to book the exact same seat
    const promises = userTokens.map((token) =>
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tripId: trip._id.toString(),
          seats: seatToBook
        })
    );

    const responses = await Promise.all(promises);

    // All requests must be accepted or rate-limited — none should 500
    responses.forEach(res => {
      expect([202, 429]).toContain(res.status);
    });

    // Count how many were actually queued (202)
    const queued = responses.filter(r => r.status === 202).length;
    expect(queued).toBeGreaterThanOrEqual(1);

    // Wait for queue to drain (ack or nack for each queued message)
    await new Promise((resolve) => {
      let processed = 0;
      const onEvent = () => {
        processed++;
        if (processed >= queued) {
          channel.off('ack', onEvent);
          channel.off('nack', onEvent);
          resolve();
        }
      };
      channel.on('ack', onEvent);
      channel.on('nack', onEvent);
      // Timeout safety
      setTimeout(resolve, 5000);
    });

    // Verify DB consistency: only 1 booking succeeded for the same seat
    const totalBookings = await Booking.countDocuments({
      tripId: trip._id,
      status: { $ne: 'cancelled' }
    });
    expect(totalBookings).toBe(1);

    const updatedTrip = await Trip.findById(trip._id);
    expect(updatedTrip.seatsBooked).toBe(1);
  });

  it('should prevent exceeding total trip seat capacity', async () => {
    const channel = getMockChannel();

    // 20 users try to book unique seats but trip only has 5 capacity
    const promises = userTokens.map((token, index) =>
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tripId: trip._id.toString(),
          seats: [`Seat-${index}`]
        })
    );

    const responses = await Promise.all(promises);

    // Accept 202 (queued) or 429 (rate limited) — no 500s
    responses.forEach(res => {
      expect([202, 429]).toContain(res.status);
    });

    const queued = responses.filter(r => r.status === 202).length;

    // Wait for queue to drain
    await new Promise((resolve) => {
      let processed = 0;
      const onEvent = () => {
        processed++;
        if (processed >= queued) {
          channel.off('ack', onEvent);
          channel.off('nack', onEvent);
          resolve();
        }
      };
      channel.on('ack', onEvent);
      channel.on('nack', onEvent);
      setTimeout(resolve, 5000);
    });

    // Confirm bookings in DB do not exceed the capacity of 5
    const totalBookings = await Booking.countDocuments({
      tripId: trip._id,
      status: { $ne: 'cancelled' }
    });
    expect(totalBookings).toBeLessThanOrEqual(5);

    const updatedTrip = await Trip.findById(trip._id);
    expect(updatedTrip.seatsBooked).toBeLessThanOrEqual(5);
  });
});
