const Notification = require('../models/Notification');
const User = require('../../users/models/User');
const { sendPushToUser, emitToCompany } = require('./notification.dispatch');

const createNotification = async ({ companyId, userId, type, title, message, key, data = {} }) => {
  return await Notification.create({ companyId, userId, type, title, message, key, data });
};

const notifyAllCustomers = async ({ companyId, type, title, message, data = {}, key }) => {
  const customers = await User.find({ companyId, role: 'customer' })
    .select('_id fcmTokens preferences');

  const notifications = customers.map((c) => ({
    companyId, userId: c._id, type, title, message, key, data,
  }));
  const created = await Notification.insertMany(notifications);

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const notif = created[i];

    emitToCompany(companyId, 'notification:new', {
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      key: notif.key,
      isRead: false,
      createdAt: notif.createdAt,
      data,
    });

    await sendPushToUser(customer, {
      title,
      body: message,
      data: { ...data, notificationId: String(notif._id) },
    }).catch(() => {});
  }

  return created;
};

module.exports = { createNotification, notifyAllCustomers };
