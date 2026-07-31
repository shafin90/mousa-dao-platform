const { getChannel } = require('../queue/channel');
const { NOTIFICATION_QUEUE } = require('../queue/queues');
const { isEventProcessed, markEventAsProcessed } = require('../services/idempotency.service');
const User = require('../modules/users/models/User');
const Notification = require('../modules/notifications/models/Notification');
const { emitToUser, sendPushToUser } = require('../modules/notifications/notification.dispatch');
const { resolveEventContent } = require('../modules/notifications/notification.eventCopy');

const startNotificationConsumer = async () => {
  const channel = await getChannel(NOTIFICATION_QUEUE);
  channel.consume(NOTIFICATION_QUEUE, async (msg) => {
    if (!msg) return;
    let event;
    try {
      event = JSON.parse(msg.content.toString());
    } catch {
      return channel.nack(msg, false, false);
    }

    const { eventType, companyId, userId, entityId, entityType } = event;
    try {
      if (!companyId) {
        console.warn('Notification consumer: missing companyId, skipping');
        return channel.ack(msg);
      }

      if (await isEventProcessed(companyId, event.eventId)) return channel.ack(msg);

      const { type, title, message } = resolveEventContent(event);

      let targetUsers;
      if (userId) {
        const user = await User.findById(userId).select('_id fcmTokens preferences').lean();
        targetUsers = user ? [user] : [];
      } else {
        targetUsers = await User.find({ companyId, role: 'customer' })
          .select('_id fcmTokens preferences')
          .lean();
      }

      for (const user of targetUsers) {
        const notif = await Notification.create({
          companyId,
          userId: user._id,
          type,
          title,
          message,
          key: entityId ? `${entityType || eventType}:${entityId}` : undefined,
        });

        const payload = {
          _id: notif._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          read: false,
          data: {},
          createdAt: notif.createdAt,
          eventType,
          entityType,
          entityId,
        };

        emitToUser(user._id, 'notification:new', payload);

        await sendPushToUser(user, {
          title,
          body: message,
          data: {
            eventType,
            entityType: entityType || '',
            entityId: entityId || '',
            notificationId: String(notif._id),
          },
        });
      }

      await markEventAsProcessed(companyId, event.eventId);
      channel.ack(msg);
    } catch (error) {
      console.error('Notification consumer error:', error.message);
      channel.nack(msg, false, false);
    }
  });
};

module.exports = { startNotificationConsumer };
