const ProcessedEvent = require('../modules/audit/models/ProcessedEvent');

/**
 * Checks if an event has already been processed (tenant-scoped idempotency).
 *
 * Idempotency key format: { companyId + eventId }
 * This prevents duplicate processing across all consumers.
 *
 * @param {string} companyId - Tenant ID
 * @param {string} eventId - Unique event identifier
 * @returns {Promise<boolean>} True if event was already processed
 */
const isEventProcessed = async (companyId, eventId) => {
  const event = await ProcessedEvent.findOne({ companyId, eventId });
  return !!event;
};

/**
 * Marks an event as processed (tenant-scoped).
 *
 * @param {string} companyId - Tenant ID
 * @param {string} eventId - Unique event identifier
 * @returns {Promise<void>}
 */
const markEventAsProcessed = async (companyId, eventId) => {
  await ProcessedEvent.create({ companyId, eventId });
};

module.exports = { isEventProcessed, markEventAsProcessed };
