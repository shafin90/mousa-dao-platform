const Notification = require('./models/Notification');
const { respond, respondPaginated } = require('../../utils/response');

exports.getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user._id, companyId: req.user.companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user._id, companyId: req.user.companyId }),
    ]);

    respondPaginated(res, notifications, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, companyId: req.user.companyId, read: false },
      { $set: { read: true, isRead: true } },
    );
    respond(res, 200, { success: true });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, userId: req.user._id, companyId: req.user.companyId },
      { $set: { read: true, isRead: true } },
    );
    respond(res, 200, { success: true });
  } catch (error) {
    next(error);
  }
};
