const { getChannel } = require('../queue/channel');
const { PAYMENT_QUEUE, PAYMENT_DLQ } = require('../queue/queues');
const { publishToQueue } = require('../queue/index');
const { isEventProcessed, markEventAsProcessed } = require('../services/idempotency.service');
const paymentService = require('../modules/payments/services/payment.service');
const auditRepository = require('../modules/audit/repositories/audit.repository');
const ProviderFactory = require('../modules/payments/providers/provider.factory');
const userRepository = require('../modules/users/repositories/user.repository');
const paymentRepository = require('../modules/payments/repositories/payment.repository');
const tripRepository = require('../modules/trips/repositories/trip.repository');
const bookingRepository = require('../modules/bookings/repositories/booking.repository');

/**
 * Payment consumer — trigger layer only.
 *
 * Delegates to paymentService and provider for business logic.
 * Handles idempotency, retry with DLQ after 3 attempts.
 */
const startPaymentConsumer = async () => {
  const channel = await getChannel(PAYMENT_QUEUE);
  channel.consume(PAYMENT_QUEUE, async (msg) => {
    if (!msg) return;
    let event;
    try {
      event = JSON.parse(msg.content.toString());
    } catch {
      return channel.nack(msg, false, false);
    }

    const { tx_ref, bookingId, userId, method, companyId, eventId } = event;
    try {
      if (await isEventProcessed(companyId, eventId)) return channel.ack(msg);

      const user = await userRepository.findById(userId, companyId);
      if (!user) throw new Error('User not found');

      const { booking } = await paymentService.initiatePaymentFlow(tx_ref, bookingId, userId, companyId, method);
      const provider = ProviderFactory.getProvider(method);
      const name = user.profile ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() : 'Customer';

      const initResult = await provider.initializePayment({
        tx_ref,
        amount: booking.totalAmount,
        currency: process.env.DEFAULT_CURRENCY || 'XOF',
        email: user.email,
        name: name || 'Customer',
        meta: { bookingId: booking._id.toString(), userId: userId.toString() },
      });

      await paymentRepository.updateProcessing(tx_ref, companyId, {
        $set: { status: 'processing', paymentLink: initResult.paymentLink },
      });

      await auditRepository.create({
        companyId, userId,
        action: 'PAYMENT_INITIATED', module: 'PAYMENTS',
        description: `Payment initiated for booking ${bookingId}`,
        metadata: { tx_ref, bookingId, amount: booking.totalAmount },
        status: 'success',
      });

      await markEventAsProcessed(companyId, eventId);
      channel.ack(msg);
    } catch (error) {
      console.error('Payment consumer error:', error.message);
      try {
        const retryCount = (event.retryCount || 0) + 1;
        if (retryCount > 3) {
          await auditRepository.create({
            companyId, userId,
            action: 'PAYMENT_FAILED', module: 'PAYMENTS',
            description: `Payment failed for booking ${bookingId}: ${error.message}`,
            metadata: { tx_ref, bookingId, error: error.message },
            status: 'failed',
          });
          if (bookingId) {
            const booking = await bookingRepository.findById(bookingId, companyId);
            if (booking && booking.status === 'pending') {
              await bookingRepository.updateOne(bookingId, companyId, { $set: { status: 'cancelled' } });
              await tripRepository.incrementSeats(booking.tripId, -booking.seats.length);
            }
          }
          await publishToQueue(PAYMENT_DLQ, { ...event, error: error.message, failedAt: new Date() });
          channel.ack(msg);
        } else {
          await publishToQueue(PAYMENT_QUEUE, { ...event, retryCount });
          channel.ack(msg);
        }
      } catch { channel.nack(msg, false, false); }
    }
  });
};

module.exports = { startPaymentConsumer };
