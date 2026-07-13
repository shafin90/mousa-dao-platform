const notificationRepository = require('../repositories/notification.repository');
const { respond, respondPaginated } = require('../../../utils/response');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationRepository.findByUser(req.user._id, req.user.companyId);
    respond(res, 200, notifications);
  } catch (error) { next(error); }
};

const getAllNotifications = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await notificationRepository.findMany(req.user.companyId, filters, Number(page) || 1, Number(limit) || 10);
    respondPaginated(res, data.notifications, data.total, Number(page) || 1, Number(limit) || 10);
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationRepository.markRead(req.params.id, req.user._id, req.user.companyId);
    if (!notification) return respond(res, 404, null, 'Notification not found');
    respond(res, 200, notification, 'Marked as read');
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationRepository.markAllRead(req.user._id, req.user.companyId);
    respond(res, 200, result, 'All marked as read');
  } catch (error) { next(error); }
};

module.exports = { getMyNotifications, getAllNotifications, markAsRead, markAllAsRead };
