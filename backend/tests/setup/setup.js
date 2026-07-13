process.env.NODE_ENV = 'test';
require('dotenv').config({ path: './.env.test' });

// Global mock of uuid to avoid ESM syntax errors in Jest
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-' + Math.floor(Math.random() * 1000000))
}));

// Global mock of amqplib
jest.mock('amqplib', () => require('./test-rabbitmq'));

const { connectDB, disconnectDB, clearDB } = require('./test-db');


beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await clearDB();
  const mockAmqp = require('./test-rabbitmq');
  mockAmqp._instance.channel.clear();
  global.fetch = jest.fn();
});
