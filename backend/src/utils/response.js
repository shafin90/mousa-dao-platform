/**
 * Consistent API response helpers.
 *
 * Every controller response MUST use these helpers to ensure
 * uniform JSON structure across the entire API.
 */

/**
 * Wraps a successful response payload.
 *
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {*} data - Response payload
 * @param {string} message - Optional success message
 */
const respond = (res, status = 200, data = null, message = 'Success') => {
  return res.status(status).json({ success: true, message, data });
};

/**
 * Wraps a paginated response.
 *
 * @param {Object} res - Express response object
 * @param {Array} items - Array of results
 * @param {number} total - Total count across all pages
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 */
const respondPaginated = (res, items, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  });
};

/**
 * Wraps an accepted (202) response for async/queue operations.
 *
 * @param {Object} res - Express response object
 * @param {string} eventId - Correlation ID for the queued operation
 * @param {*} extra - Additional data
 */
const respondAccepted = (res, eventId, extra = {}) => {
  return res.status(202).json({
    success: true,
    message: 'Request accepted and queued for processing',
    data: { eventId, ...extra },
  });
};

module.exports = { respond, respondPaginated, respondAccepted };
