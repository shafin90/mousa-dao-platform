const EventEmitter = require('events');

class MockChannel extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.prefetchCount = 0;
  }

  async assertQueue(queue, options = {}) {
    if (!this.queues.has(queue)) {
      this.queues.set(queue, []);
    }
    return { queue };
  }

  async sendToQueue(queue, content, options = {}) {
    if (!this.queues.has(queue)) {
      this.queues.set(queue, []);
    }
    this.queues.get(queue).push({ content: content.toString(), options, timestamp: Date.now() });
    this.emit('message', { queue, content: content.toString() });
    return true;
  }

  async consume(queue, onMessage, options = {}) {
    this._consumerCallback = onMessage;
    return { consumerTag: `consumer-${queue}-${Date.now()}` };
  }

  async ack(message) {
    return true;
  }

  async nack(message, allUpTo = false, requeue = false) {
    return true;
  }

  async prefetch(count) {
    this.prefetchCount = count;
  }

  getMessages(queue) {
    return this.queues.get(queue) || [];
  }

  clearQueue(queue) {
    this.queues.set(queue, []);
  }
}

class MockConnection extends EventEmitter {
  constructor() {
    super();
    this.channels = [];
  }

  async createChannel() {
    const ch = new MockChannel();
    this.channels.push(ch);
    return ch;
  }

  async close() {
    this.emit('close');
  }
}

let mockConnection = null;

const connect = async () => {
  if (!mockConnection) {
    mockConnection = new MockConnection();
    console.log('Mock RabbitMQ connected');
  }
  return mockConnection;
};

const getMockConnection = () => mockConnection;

const resetMock = () => {
  if (mockConnection) {
    mockConnection.channels.forEach(ch => ch.removeAllListeners());
    mockConnection.channels = [];
    mockConnection.queues = new Map();
  }
  mockConnection = null;
};

module.exports = { connect, getMockConnection, resetMock, MockChannel, MockConnection };
