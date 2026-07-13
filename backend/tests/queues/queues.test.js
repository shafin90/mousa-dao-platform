const { startPaymentConsumer } = require('../../src/consumers/payment.consumer');
const { getMockChannel } = require('../helpers/queue.helper');
const { PAYMENT_QUEUE, PAYMENT_DLQ } = require('../../src/queue/queues');
const Booking = require('../../src/modules/bookings/models/Booking');
const { createTestUser } = require('../helpers/auth.helper');
const { setupTestRouteAndTrip, createTestBooking } = require('../helpers/booking.helper');

describe('RabbitMQ Queues & Retry Consumer Tests', () => {
  let customer;
  let trip;
  let booking;

  beforeEach(async () => {
    customer = await createTestUser();
    const data = await setupTestRouteAndTrip();
    trip = data.trip;
    booking = await createTestBooking(customer.user._id, trip._id);

    await startPaymentConsumer();
  });

  it('should retry a message on failure and increment retryCount', async () => {
    const channel = getMockChannel();

    // Track all messages sent to PAYMENT_QUEUE (including retries)
    const retryMessages = [];
    const originalSendToQueue = channel.sendToQueue.bind(channel);
    channel.sendToQueue = async (queue, content, options) => {
      if (queue === PAYMENT_QUEUE) {
        const parsed = JSON.parse(content.toString());
        if (parsed.retryCount) retryMessages.push(parsed);
      }
      return originalSendToQueue(queue, content, options);
    };

    // We expect the consumer to fail because unsupported-method causes ProviderFactory to throw
    const payload = {
      eventType: 'INITIATE_PAYMENT',
      eventId: 'event-uuid-retry-1',
      tx_ref: 'tx-ref-retry-1',
      bookingId: booking._id.toString(),
      userId: customer.user._id.toString(),
      method: 'unsupported-method'
    };

    // Wait for the original ack (consumer handles initial failure, acks and publishes retry)
    const ackPromise = new Promise(resolve => {
      channel.once('ack', resolve);
    });

    await channel.sendToQueue(PAYMENT_QUEUE, Buffer.from(JSON.stringify(payload)));
    await ackPromise;

    // Give consumer time to publish the retry message
    await new Promise(r => setTimeout(r, 200));

    expect(retryMessages.length).toBeGreaterThanOrEqual(1);
    expect(retryMessages[0].eventId).toBe('event-uuid-retry-1');
    expect(retryMessages[0].retryCount).toBe(1);
  });

  it('should route message to DLQ and cancel booking when retryCount exceeds 3', async () => {
    const channel = getMockChannel();

    const payload = {
      eventType: 'INITIATE_PAYMENT',
      eventId: 'event-uuid-dlq-1',
      tx_ref: 'tx-ref-dlq-1',
      bookingId: booking._id.toString(),
      userId: customer.user._id.toString(),
      method: 'unsupported-method',
      retryCount: 3 // next retry would be 4, triggering DLQ
    };

    // Assert booking is pending before
    const initialBooking = await Booking.findById(booking._id);
    expect(initialBooking.status).toBe('pending');

    // Track DLQ messages
    const dlqMessages = [];
    const originalSendToQueue = channel.sendToQueue.bind(channel);
    channel.sendToQueue = async (queue, content, options) => {
      if (queue === PAYMENT_DLQ) {
        dlqMessages.push(JSON.parse(content.toString()));
      }
      return originalSendToQueue(queue, content, options);
    };

    const ackPromise = new Promise(resolve => {
      channel.once('ack', resolve);
    });

    await channel.sendToQueue(PAYMENT_QUEUE, Buffer.from(JSON.stringify(payload)));
    await ackPromise;

    // Give consumer time to finish DLQ publish and booking cancel
    await new Promise(r => setTimeout(r, 500));

    // Verify it moved to DLQ
    expect(dlqMessages.length).toBeGreaterThanOrEqual(1);
    expect(dlqMessages[0].eventId).toBe('event-uuid-dlq-1');

    // Verify booking is cancelled
    const updatedBooking = await Booking.findById(booking._id);
    expect(updatedBooking.status).toBe('cancelled');
  });
});
