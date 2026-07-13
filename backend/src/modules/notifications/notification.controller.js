const notificationService = require('./notification.service');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user._id, req.user.companyId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await notificationService.getAllNotifications(req.user.companyId, filters, parseInt(page) || 1, parseInt(limit) || 10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id, req.user.companyId);
    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id, req.user.companyId);
    res.json({ success: true, message: 'All notifications marked as read', data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getMyNotifications, getAllNotifications, markAsRead, markAllAsRead };
