const Notification = require('./models/Notification');
const User = require('../users/models/User');
const { sendPushToUser } = require('./notification.dispatch');

const createNotification = async ({ companyId, userId, type, title, message, data = {} }) => {
  const notification = await Notification.create({ companyId, userId, type, title, message, data });
  return notification;
};

const notifyAllCustomers = async ({ companyId, type, title, message, data = {} }) => {
  const customers = await User.find({ companyId, role: 'customer' }).select('_id fcmTokens preferences');
  const notifications = customers.map((c) => ({
    companyId, userId: c._id, type, title, message, data,
  }));
  const created = await Notification.insertMany(notifications);
  for (const customer of customers) {
    await sendPushToUser(customer, { title, body: message, data }).catch(() => {});
  }
  return created;
};

module.exports = { createNotification, notifyAllCustomers };
