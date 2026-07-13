const RefundRequest = require('./models/RefundRequest');

const getAll = async (companyId, filters, page = 1, limit = 10) => {
  const query = { companyId };
  if (filters.status) query.status = filters.status;

  const refunds = await RefundRequest.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'profile firstName lastName email')
    .populate('bookingId', 'bookingCode')
    .populate('reviewedBy', 'profile firstName lastName email');

  const total = await RefundRequest.countDocuments(query);
  return { refunds, total };
};

const getById = async (id, companyId) => {
  return await RefundRequest.findOne({ _id: id, companyId })
    .populate('userId', 'profile firstName lastName email')
    .populate('bookingId', 'bookingCode')
    .populate('reviewedBy', 'profile firstName lastName email');
};

const approve = async (id, companyId, adminId, adminNote) => {
  const refund = await RefundRequest.findOne({ _id: id, companyId });
  if (!refund) throw new Error('Refund request not found');
  if (refund.status !== 'pending') throw new Error('Refund request is already ' + refund.status);

  refund.status = 'approved';
  refund.reviewedBy = adminId;
  refund.reviewedAt = new Date();
  if (adminNote) refund.adminNote = adminNote;
  await refund.save();

  return await getById(refund._id, companyId);
};

const reject = async (id, companyId, adminId, adminNote) => {
  const refund = await RefundRequest.findOne({ _id: id, companyId });
  if (!refund) throw new Error('Refund request not found');
  if (refund.status !== 'pending') throw new Error('Refund request is already ' + refund.status);

  refund.status = 'rejected';
  refund.reviewedBy = adminId;
  refund.reviewedAt = new Date();
  refund.adminNote = adminNote || '';
  await refund.save();

  return await getById(refund._id, companyId);
};

module.exports = { getAll, getById, approve, reject };
