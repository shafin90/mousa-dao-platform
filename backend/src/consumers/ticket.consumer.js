const { getChannel } = require('../queue/channel');
const { TICKET_QUEUE, TICKET_DLQ, NOTIFICATION_QUEUE } = require('../queue/queues');
const { publishToQueue, queues } = require('../queue/index');
const { isEventProcessed, markEventAsProcessed } = require('../services/idempotency.service');
const ticketService = require('../modules/tickets/services/ticket.service');
const bookingRepository = require('../modules/bookings/repositories/booking.repository');
const ticketRepository = require('../modules/tickets/repositories/ticket.repository');
const auditRepository = require('../modules/audit/repositories/audit.repository');
const { v4: uuidv4 } = require('uuid');

/**
 * Ticket consumer — trigger layer only.
 *
 * Delegates to ticketService.createTicket for business logic.
 * Handles idempotency and pushes notification event on success.
 */
const startTicketConsumer = async () => {
  const channel = await getChannel(TICKET_QUEUE);
  channel.consume(TICKET_QUEUE, async (msg) => {
    if (!msg) return;
    let event;
    try {
      event = JSON.parse(msg.content.toString());
    } catch {
      return channel.nack(msg, false, false);
    }

    const { bookingId, eventId, companyId } = event;
    try {
      if (await isEventProcessed(companyId, eventId)) return channel.ack(msg);

      const existing = await ticketRepository.findByBooking(bookingId, companyId);
      if (existing) {
        await markEventAsProcessed(companyId, eventId);
        return channel.ack(msg);
      }

      const booking = await bookingRepository.findById(bookingId, companyId);
      if (!booking) throw new Error(`Booking not found: ${bookingId}`);

      const ticket = await ticketService.createTicket(booking);
      await markEventAsProcessed(companyId, eventId);

      await publishToQueue(queues.NOTIFICATION_QUEUE, {
        eventType: 'TICKET_GENERATED', companyId, bookingId, ticketId: ticket._id, userId: booking.userId, eventId: uuidv4(),
      });
      await auditRepository.create({ companyId, userId: booking.userId, action: 'TICKET_GENERATED', module: 'TICKETS', description: `Ticket ${ticket.ticketNumber} generated`, metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber, bookingId }, status: 'success' });

      channel.ack(msg);
    } catch (error) {
      console.error('Ticket consumer error:', error.message);
      try {
        const retryCount = (event.retryCount || 0) + 1;
        if (retryCount > 3) {
          await auditRepository.create({ companyId, action: 'TICKET_GENERATION_FAILED', module: 'TICKETS', description: `Ticket failed for ${bookingId}`, metadata: { bookingId, error: error.message }, status: 'failed' });
          await publishToQueue(TICKET_DLQ, { ...event, error: error.message, failedAt: new Date() });
          channel.ack(msg);
        } else {
          await publishToQueue(TICKET_QUEUE, { ...event, retryCount });
          channel.ack(msg);
        }
      } catch { channel.nack(msg, false, false); }
    }
  });
};

module.exports = { startTicketConsumer };
