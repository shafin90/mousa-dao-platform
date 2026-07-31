const { publishToQueue, queues } = require('../../../queue/index');
const { v4: uuidv4 } = require('uuid');

const publishEntityUpdateEvent = async ({ companyId, entityType, entityId, title, message, type }) => {
  if (!companyId) return;
  await publishToQueue(queues.NOTIFICATION_QUEUE, {
    eventType: `${entityType.toUpperCase()}_UPDATED`,
    companyId,
    entityType,
    entityId: String(entityId),
    title,
    message,
    type: type || 'system',
    eventId: uuidv4(),
    timestamp: new Date(),
  });
};

module.exports = { publishEntityUpdateEvent };
