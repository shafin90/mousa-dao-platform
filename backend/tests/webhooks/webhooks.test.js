const request = require('supertest');
const app = require('../../src/app');
const { getMockChannel, waitForMessage } = require('../helpers/queue.helper');

const { PAYMENT_WEBHOOK_QUEUE } = require('../../src/queue/queues');

describe('Webhooks Route Tests', () => {
  const webhookSecret = process.env.FLW_WEBHOOK_SECRET || 'test-webhook-secret';

  it('should accept valid webhook and publish to webhook queue', async () => {
    const channel = getMockChannel();

    const payload = {
      event: 'charge.completed',
      data: {
        id: 998877,
        tx_ref: 'tx-ref-unique-1',
        amount: 100,
        currency: 'XOF',
        status: 'successful'
      }
    };

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('verif-hash', webhookSecret)
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.eventId).toBeDefined();

    const queuesList = channel.queues.get(PAYMENT_WEBHOOK_QUEUE) || [];
    expect(queuesList.length).toBe(1);
    const event = JSON.parse(queuesList[0].content.toString());
    expect(event.eventType).toBe('WEBHOOK_RECEIVED');
    expect(event.tx_ref).toBe('tx-ref-unique-1');
    expect(event.transactionId).toBe('998877');
  });

  it('should reject webhook with invalid signature verif-hash', async () => {
    const payload = {
      event: 'charge.completed',
      data: {
        id: 998877,
        tx_ref: 'tx-ref-unique-1',
        amount: 100,
        currency: 'XOF',
        status: 'successful'
      }
    };

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('verif-hash', 'wrong-signature')
      .send(payload);

    expect(res.status).toBe(401);
  });

  it('should reject webhook with missing signature header', async () => {
    const payload = {
      event: 'charge.completed',
      data: {
        id: 998877,
        tx_ref: 'tx-ref-unique-1',
        amount: 100,
        currency: 'XOF',
        status: 'successful'
      }
    };

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send(payload);

    expect(res.status).toBe(401);
  });
});
