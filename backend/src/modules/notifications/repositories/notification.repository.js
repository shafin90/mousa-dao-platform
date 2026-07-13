const Notification = require('../models/Notification');

/**
 * Lists notifications for a user within company.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const findByUser = async (userId, companyId) => {
  return await Notification.find({ userId, companyId }).sort({ createdAt: -1 });
};

/**
 * Lists all notifications for a company with filters.
 *
 * @param {string} companyId
 * @param {Object} filters - { type, userId, isRead }
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{notifications: Array, total: number}>}
 */
const findMany = async (companyId, filters = {}, page = 1, limit = 10) => {
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

/**
 * Marks a single notification as read.
 *
 * @param {string} id
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const markRead = async (id, userId, companyId) => {
  return await Notification.findOneAndUpdate(
    { _id: id, userId, companyId },
    { $set: { isRead: true } },
    { new: true }
  );
};

/**
 * Marks all unread notifications as read for a user.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<{modifiedCount: number}>}
 */
const markAllRead = async (userId, companyId) => {
  const result = await Notification.updateMany(
    { userId, companyId, isRead: false },
    { $set: { isRead: true } }
  );
  return { modifiedCount: result.modifiedCount };
};

module.exports = { findByUser, findMany, markRead, markAllRead };
