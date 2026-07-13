const Notification = require('./models/Notification');

const getUserNotifications = async (userId, companyId) => {
  return await Notification.find({ userId, companyId }).sort({ createdAt: -1 });
};

const getAllNotifications = async (companyId, filters, page = 1, limit = 10) => {
  const query = { companyId };
  if (filters.type) query.type = filters.type;
  if (filters.userId) query.userId = filters.userId;
  if (filters.isRead !== undefined) query.isRead = filters.isRead === 'true';

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'name email');

  const total = await Notification.countDocuments(query);
  return { notifications, total };
};

const markAsRead = async (id, userId, companyId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId, companyId },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) throw new Error('Notification not found');
  return notification;
};

const markAllAsRead = async (userId, companyId) => {
  const result = await Notification.updateMany(
    { userId, companyId, isRead: false },
    { $set: { isRead: true } }
  );
  return { modifiedCount: result.modifiedCount };
};

module.exports = { getUserNotifications, getAllNotifications, markAsRead, markAllAsRead };
