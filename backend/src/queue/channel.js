const { connect } = require('./connection');
const { 
  BOOKING_QUEUE, 
  PAYMENT_QUEUE, 
  PAYMENT_WEBHOOK_QUEUE, 
  TICKET_QUEUE, 
  NOTIFICATION_QUEUE,
  PAYMENT_DLQ,
  WEBHOOK_DLQ,
  TICKET_DLQ
} = require('./queues');

let criticalChannel = null;
let notificationChannel = null;

const getChannel = async (queueName) => {
  const connection = await connect();
  if (!connection) throw new Error('RabbitMQ not available');

  if (queueName === NOTIFICATION_QUEUE) {
    if (!notificationChannel) {
      notificationChannel = await connection.createChannel();
      await notificationChannel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
      await notificationChannel.prefetch(5);
    }
    return notificationChannel;
  } else {
    if (!criticalChannel) {
      criticalChannel = await connection.createChannel();
      
      // Assert critical queues
      await criticalChannel.assertQueue(BOOKING_QUEUE, { durable: true });
      await criticalChannel.assertQueue(PAYMENT_QUEUE, { durable: true });
      await criticalChannel.assertQueue(PAYMENT_WEBHOOK_QUEUE, { durable: true });
      await criticalChannel.assertQueue(TICKET_QUEUE, { durable: true });

      // Assert DLQs
      await criticalChannel.assertQueue(PAYMENT_DLQ, { durable: true });
      await criticalChannel.assertQueue(WEBHOOK_DLQ, { durable: true });
      await criticalChannel.assertQueue(TICKET_DLQ, { durable: true });
      
      await criticalChannel.prefetch(1);
    }
    return criticalChannel;
  }
};

module.exports = { getChannel };
