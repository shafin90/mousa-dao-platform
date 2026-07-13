const path = require('path');
const dotenv = require('dotenv');

process.env.NODE_ENV = 'test';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env.test') });

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'testsecret';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '1h';
if (!process.env.FLW_WEBHOOK_SECRET) process.env.FLW_WEBHOOK_SECRET = 'test-webhook-secret';
if (!process.env.FLW_SECRET_KEY) process.env.FLW_SECRET_KEY = 'test-flw-secret';
if (!process.env.FLW_PUBLIC_KEY) process.env.FLW_PUBLIC_KEY = 'test-flw-public';
if (!process.env.FLW_ENCRYPTION_KEY) process.env.FLW_ENCRYPTION_KEY = 'test-flw-encryption';
if (!process.env.FLW_BASE_URL) process.env.FLW_BASE_URL = 'https://api.flutterwave.com/v3';
if (!process.env.BASE_URL) process.env.BASE_URL = 'http://localhost:3000';
if (!process.env.DEFAULT_CURRENCY) process.env.DEFAULT_CURRENCY = 'XOF';

process.env.RABBITMQ_URL = 'amqp://mock';

jest.mock('amqplib', () => {
  const testRabbitmq = require('./test-rabbitmq');
  return {
    connect: testRabbitmq.connect,
  };
});

jest.mock('uuid', () => {
  let counter = 0;
  return {
    v4: () => `mock-uuid-${++counter}`,
  };
});

const testDb = require('./test-db');

beforeAll(async () => {
  await testDb.connect();
});

beforeEach(async () => {
  await testDb.clear();
});

afterAll(async () => {
  await testDb.close();
});
