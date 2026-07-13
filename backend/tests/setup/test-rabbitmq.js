const EventEmitter = require('events');

class MockChannel extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.consumers = new Map();
    this.prefetchCount = 1;
    this._pendingTimers = [];
  }

  async assertQueue(queue, options) {
    if (!this.queues.has(queue)) {
      this.queues.set(queue, []);
    }
    return { queue, messageCount: this.queues.get(queue).length, consumerCount: this.consumers.has(queue) ? 1 : 0 };
  }

  async prefetch(count) {
    this.prefetchCount = count;
  }

  async consume(queue, callback, options) {
    this.consumers.set(queue, callback);
    const messages = this.queues.get(queue) || [];
    this.queues.set(queue, []);
    for (const msg of messages) {
      const t = setTimeout(() => callback(msg), 0);
      this._pendingTimers.push(t);
    }
  }

  async sendToQueue(queue, content, options) {
    const msg = {
      content,
      properties: options || {},
      fields: { deliveryTag: Math.random().toString() }
    };

    const consumer = this.consumers.get(queue);
    if (consumer) {
      const t = setTimeout(() => consumer(msg), 0);
      this._pendingTimers.push(t);
    } else {
      if (!this.queues.has(queue)) {
        this.queues.set(queue, []);
      }
      this.queues.get(queue).push(msg);
    }
    return true;
  }

  ack(msg) {
    this.emit('ack', msg);
  }

  nack(msg, allUpTo, requeue) {
    this.emit('nack', msg, allUpTo, requeue);
  }

  clear() {
    // Cancel all pending delivery timers to prevent stale messages
    // firing after DB is torn down
    for (const t of this._pendingTimers) {
      clearTimeout(t);
    }
    this._pendingTimers = [];
    this.queues.clear();
    this.consumers.clear();
    this.removeAllListeners();
  }
}

class MockConnection {
  constructor() {
    this.channel = new MockChannel();
  }

  async createChannel() {
    return this.channel;
  }

  async close() {
    // No-op
  }
}

const mockConnectionInstance = new MockConnection();

module.exports = {
  connect: async (url) => {
    return mockConnectionInstance;
  },
  _instance: mockConnectionInstance
};
