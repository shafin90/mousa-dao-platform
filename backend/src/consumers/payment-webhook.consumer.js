const { getChannel } = require('../queue/channel');
const { PAYMENT_WEBHOOK_QUEUE, WEBHOOK_DLQ, TICKET_QUEUE, NOTIFICATION_QUEUE } = require('../queue/queues');
const { publishToQueue, queues } = require('../queue/index');
const paymentService = require('../modules/payments/services/payment.service');
const { validateStatusTransition } = require('../modules/payments/services/payment.status.service');
const ProviderFactory = require('../modules/payments/providers/provider.factory');
const processedPaymentEventRepo = require('../modules/payments/repositories/processedPaymentEvent.repository');
const paymentRepository = require('../modules/payments/repositories/payment.repository');
const auditRepository = require('../modules/audit/repositories/audit.repository');
const { v4: uuidv4 } = require('uuid');

/**
 * Webhook consumer — trigger layer only.
 *
 * Validates idempotency, delegates to paymentService for business logic.
 */
const startWebhookConsumer = async () => {
  const channel = await getChannel(PAYMENT_WEBHOOK_QUEUE);
  channel.consume(PAYMENT_WEBHOOK_QUEUE, async (msg) => {
    if (!msg) return;
    let event;
    try {
      event = JSON.parse(msg.content.toString());
    } catch {
      return channel.nack(msg, false, false);
    }

    const { eventId, tx_ref, transactionId, payload, companyId } = event;
    try {
      try {
        await processedPaymentEventRepo.create({ companyId, eventId, tx_ref, transactionId });
      } catch (error) {
        if (error.code === 11000) {
          console.log(`Duplicate webhook blocked: ${tx_ref}`);
          await auditRepository.create({ companyId, action: 'DUPLICATE_WEBHOOK_BLOCKED', module: 'PAYMENTS', description: `Duplicate webhook for ${tx_ref}`, metadata: { eventId, tx_ref, transactionId }, status: 'failed' });
          return channel.ack(msg);
        }
        throw error;
      }

      const provider = ProviderFactory.getProvider('flutterwave');
      const verification = await provider.verifyTransaction(transactionId);
      const payment = await paymentRepository.findByTxRef(tx_ref, companyId);
      if (!payment) throw new Error(`Payment not found for ${tx_ref}`);

      const booking = await paymentService.getPaymentByTxRef(tx_ref, companyId);
      if (!booking) throw new Error(`Booking not found for ${payment.bookingId}`);

      if (payment.status === 'success') return channel.ack(msg);

      validateStatusTransition(payment.status, verification.status);

      const updatedPayment = await paymentRepository.updateProcessing(tx_ref, companyId, {
        $set: { status: verification.status, transactionId, providerResponse: verification.rawData },
      });
      if (!updatedPayment) return channel.ack(msg);

      if (verification.status === 'success') {
        await paymentService.processSuccessfulPayment(payment.bookingId, companyId, tx_ref, transactionId);
      } else {
        await paymentService.processFailedPayment(payment.bookingId, companyId, tx_ref, transactionId, payment.userId);
      }

      channel.ack(msg);
    } catch (error) {
      console.error('Webhook consumer error:', error.message);
      try {
        const retryCount = (event.retryCount || 0) + 1;
        if (retryCount > 3) {
          await auditRepository.create({ companyId, action: 'WEBHOOK_FAILED', module: 'PAYMENTS', description: `Webhook failed for ${tx_ref}`, metadata: { tx_ref, transactionId, error: error.message }, status: 'failed' });
          await publishToQueue(WEBHOOK_DLQ, { ...event, error: error.message, failedAt: new Date() });
          channel.ack(msg);
        } else {
          await publishToQueue(PAYMENT_WEBHOOK_QUEUE, { ...event, retryCount });
          channel.ack(msg);
        }
      } catch { channel.nack(msg, false, false); }
    }
  });
};

module.exports = { startWebhookConsumer };
