const mockAmqp = require('../setup/test-rabbitmq');

const getMockChannel = () => {
  return mockAmqp._instance.channel;
};

const waitForMessage = (channel, eventName = 'ack') => {
  return new Promise((resolve) => {
    channel.once(eventName, (msg) => {
      resolve(msg);
    });
  });
};

module.exports = { getMockChannel, waitForMessage };
