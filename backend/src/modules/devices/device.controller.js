const User = require('../users/models/User');
const { respond } = require('../../utils/response');

const registerDevice = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return respond(res, 400, null, 'fcmToken is required');

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { fcmTokens: fcmToken },
    });

    respond(res, 200, null, 'Device registered');
  } catch (error) {
    next(error);
  }
};

const unregisterDevice = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return respond(res, 400, null, 'fcmToken is required');

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { fcmTokens: fcmToken },
    });

    respond(res, 200, null, 'Device unregistered');
  } catch (error) {
    next(error);
  }
};

module.exports = { registerDevice, unregisterDevice };
