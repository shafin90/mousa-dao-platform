const amqp = require('amqplib');
require('dotenv').config();

let connection = null;

const connect = async () => {
  if (connection) return connection;
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    console.log('Connected to RabbitMQ');
    return connection;
  } catch (error) {
    console.error('RabbitMQ connection failed (non-blocking):', error.message);
    return null;
  }
};

module.exports = { connect };
