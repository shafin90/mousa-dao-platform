const RefundRequest = require('../models/RefundRequest');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

const populateRefund = [
  { path: 'userId', select: 'profile firstName lastName email' },
  { path: 'bookingId', select: 'bookingCode' },
  { path: 'reviewedBy', select: 'profile firstName lastName email' },
];

/**
 * Lists refund requests for a company.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getAll = async (companyId, filters, page, limit) => {
  const query = { companyId };
  if (filters.status) query.status = filters.status;
  const refunds = await RefundRequest.find(query)
    .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
    .populate(populateRefund);
  const total = await RefundRequest.countDocuments(query);
  return { refunds, total };
};

/**
 * Fetches a refund request by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getById = async (id, companyId) => {
  return await RefundRequest.findOne({ _id: id, companyId }).populate(populateRefund);
};

/**
 * Approves a pending refund request.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {string} adminId
 * @param {string} [adminNote]
 * @returns {Promise<Object>}
 */
const approve = async (id, companyId, adminId, adminNote) => {
  const refund = await RefundRequest.findOne({ _id: id, companyId });
  if (!refund) throw new AppError('Refund request not found', 404, ErrorCodes.REFUND_NOT_FOUND);
  if (refund.status !== 'pending') throw new AppError('Refund already processed', 400, ErrorCodes.REFUND_ALREADY_PROCESSED);
  refund.status = 'approved';
  refund.reviewedBy = adminId;
  refund.reviewedAt = new Date();
  if (adminNote) refund.adminNote = adminNote;
  await refund.save();
  return await getById(refund._id, companyId);
};

/**
 * Rejects a pending refund request.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {string} adminId
 * @param {string} [adminNote]
 * @returns {Promise<Object>}
 */
const reject = async (id, companyId, adminId, adminNote) => {
  const refund = await RefundRequest.findOne({ _id: id, companyId });
  if (!refund) throw new AppError('Refund request not found', 404, ErrorCodes.REFUND_NOT_FOUND);
  if (refund.status !== 'pending') throw new AppError('Refund already processed', 400, ErrorCodes.REFUND_ALREADY_PROCESSED);
  refund.status = 'rejected';
  refund.reviewedBy = adminId;
  refund.reviewedAt = new Date();
  refund.adminNote = adminNote || '';
  await refund.save();
  return await getById(refund._id, companyId);
};

module.exports = { getAll, getById, approve, reject };
