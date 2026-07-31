const admin = require('../../../config/firebase');
const User = require('../../users/models/User');

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const sendPushToUser = async (user, { title, body, data = {} }) => {
  if (user.preferences?.notificationsEnabled === false) return;
  if (!admin.apps.length || !admin.messaging) return;

  const fcmTokens = user.fcmTokens || [];
  if (fcmTokens.length === 0) return;

  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v == null ? '' : String(v)]),
  );

  const result = await admin.messaging().sendEachForMulticast({
    tokens: fcmTokens,
    notification: { title, body },
    data: stringData,
  });

  const invalidTokens = [];
  result.responses.forEach((resp, i) => {
    if (!resp.success && resp.error?.code && INVALID_TOKEN_CODES.has(resp.error.code)) {
      invalidTokens.push(fcmTokens[i]);
    }
  });
  if (invalidTokens.length > 0) {
    await User.findByIdAndUpdate(user._id, {
      $pull: { fcmTokens: { $in: invalidTokens } },
    });
  }
};

const emitToCompany = (companyId, event, data) => {
  try {
    const socket = require('../../../socket/index');
    const io = socket.getIO();
    if (io) io.to(`company:${companyId}`).emit(event, data);
  } catch {
    // socket not available
  }
};

module.exports = { sendPushToUser, emitToCompany };
