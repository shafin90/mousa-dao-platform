const { getChannel } = require('./channel');
const queues = require('./queues');

const publishToQueue = async (queueName, data) => {
  const channel = await getChannel(queueName);
  return channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
};

module.exports = {
  publishToQueue,
  queues,
};
