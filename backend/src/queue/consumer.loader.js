const { startBookingConsumer } = require('../consumers/booking.consumer');
const { startPaymentConsumer } = require('../consumers/payment.consumer');
const { startWebhookConsumer } = require('../consumers/payment-webhook.consumer');
const { startTicketConsumer } = require('../consumers/ticket.consumer');
const { startNotificationConsumer } = require('../consumers/notification.consumer');

const loadConsumers = async () => {
  const consumers = [
    { name: 'Booking', start: startBookingConsumer },
    { name: 'Payment', start: startPaymentConsumer },
    { name: 'PaymentWebhook', start: startWebhookConsumer },
    { name: 'Ticket', start: startTicketConsumer },
    { name: 'Notification', start: startNotificationConsumer },
  ];
  let started = 0;
  for (const { name, start } of consumers) {
    try {
      await start();
      started++;
      console.log(`  ✓ ${name} consumer started`);
    } catch (error) {
      console.error(`  ✗ ${name} consumer skipped:`, error.message);
    }
  }
  if (started > 0) console.log(`${started}/${consumers.length} consumer(s) started`);
};

module.exports = { loadConsumers };
