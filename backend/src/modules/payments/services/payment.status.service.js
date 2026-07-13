const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

const VALID_TRANSITIONS = {
  pending: ['processing', 'success', 'failed', 'expired'],
  processing: ['success', 'failed', 'expired'],
  success: ['refunded'],
  failed: [],
  refunded: [],
  expired: [],
};

/**
 * Validates that a payment status transition is allowed.
 *
 * FLOW:
 * 1. Look up current status in transition map
 * 2. Check next status is in allowed transitions
 * 3. Throw if invalid
 *
 * INPUT:
 * @param {string} currentStatus
 * @param {string} nextStatus
 *
 * OUTPUT:
 * @returns {void}
 *
 * SIDE EFFECTS: None
 */
const validateStatusTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid payment status transition from ${currentStatus} to ${nextStatus}`,
      400,
      ErrorCodes.PAYMENT_INVALID_TRANSITION
    );
  }
};

module.exports = { validateStatusTransition };
