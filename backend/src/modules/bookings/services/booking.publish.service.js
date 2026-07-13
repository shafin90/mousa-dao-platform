const { publishToQueue, queues } = require('../../../queue/index');
const { v4: uuidv4 } = require('uuid');

/**
 * Publishes a booking creation event to RabbitMQ.
 *
 * FLOW:
 * 1. Generate unique eventId
 * 2. Build event payload with companyId
 * 3. Publish to booking.queue
 *
 * INPUT:
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.companyId
 * @param {string} params.tripId
 * @param {Array<string>} params.seats
 *
 * OUTPUT:
 * @returns {Promise<string>} eventId
 *
 * SIDE EFFECTS:
 * - Publishes to booking.queue
 */
const publishBookingEvent = async ({ userId, companyId, tripId, seats }) => {
  const eventId = uuidv4();
  await publishToQueue(queues.BOOKING_QUEUE, {
    eventType: 'CREATE_BOOKING',
    eventId,
    companyId,
    userId,
    tripId,
    seats,
    timestamp: new Date(),
  });
  return eventId;
};

/**
 * Publishes a ticket-required event after a booking is created.
 *
 * @param {string} companyId
 * @param {string} bookingId
 * @returns {Promise<void>}
 */
const publishTicketRequiredEvent = async (companyId, bookingId) => {
  await publishToQueue(queues.TICKET_QUEUE, {
    eventType: 'TICKET_REQUIRED',
    companyId,
    bookingId,
    eventId: uuidv4(),
  });
};

/**
 * Publishes a notification event to the notification queue.
 *
 * @param {string} eventType
 * @param {string} companyId
 * @param {string} bookingId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const publishNotificationEvent = async (eventType, companyId, bookingId, userId) => {
  await publishToQueue(queues.NOTIFICATION_QUEUE, {
    eventType,
    companyId,
    bookingId,
    userId,
    eventId: uuidv4(),
  });
};

module.exports = { publishBookingEvent, publishTicketRequiredEvent, publishNotificationEvent };
