const { getChannel } = require('../queue/channel');
const { BOOKING_QUEUE, TICKET_QUEUE } = require('../queue/queues');
const { publishToQueue } = require('../queue/index');
const { isEventProcessed, markEventAsProcessed } = require('../services/idempotency.service');
const bookingService = require('../modules/bookings/services/booking.service');
const { v4: uuidv4 } = require('uuid');

/**
 * Booking consumer — trigger layer only.
 *
 * Delegates to bookingService.createBooking for all business logic.
 * Handles idempotency and publishes TICKET_REQUIRED event on success.
 */
const startBookingConsumer = async () => {
  const channel = await getChannel(BOOKING_QUEUE);
  channel.consume(BOOKING_QUEUE, async (msg) => {
    if (!msg) return;
    const event = JSON.parse(msg.content.toString());
    try {
      if (await isEventProcessed(event.companyId, event.eventId)) {
        return channel.ack(msg);
      }
      const { booking } = await bookingService.createBooking(event.userId, event.companyId, {
        tripId: event.tripId,
        seats: event.seats,
      });
      await markEventAsProcessed(event.companyId, event.eventId);
      await publishToQueue(TICKET_QUEUE, {
        eventType: 'TICKET_REQUIRED',
        companyId: event.companyId,
        bookingId: booking._id,
        eventId: uuidv4(),
      });
      channel.ack(msg);
    } catch (error) {
      console.error('Booking consumer error:', error.message);
      channel.nack(msg, false, false);
    }
  });
};

module.exports = { startBookingConsumer };
