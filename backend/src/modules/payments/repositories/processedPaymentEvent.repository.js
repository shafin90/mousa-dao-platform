const ProcessedPaymentEvent = require('../models/ProcessedPaymentEvent');

/**
 * Creates a processed payment event record for idempotency.
 *
 * @param {Object} data - { companyId, eventId, tx_ref, transactionId }
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  return await ProcessedPaymentEvent.create(data);
};

module.exports = { create };
