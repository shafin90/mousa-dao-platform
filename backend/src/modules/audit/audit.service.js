const Audit = require('./audit.model');

const log = async ({ companyId, userId, action, module, description, metadata, status, req }) => {
  try {
    const auditEntry = new Audit({
      companyId,
      userId,
      action,
      module,
      description,
      metadata,
      status,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'],
      userAgent: req?.headers['user-agent']
    });
    auditEntry.save().catch(err => console.error('Audit log failed:', err));
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

const logAction = async ({ companyId, userId, action, module, description, metadata, status, req }) => {
  const auditEntry = new Audit({
    companyId,
    userId,
    action,
    module,
    description,
    metadata,
    status,
    ipAddress: req?.ip || req?.headers['x-forwarded-for'],
    userAgent: req?.headers['user-agent']
  });
  await auditEntry.save();
  return auditEntry;
};

const getAllAuditLogs = async (companyId, filters, page = 1, limit = 20) => {
  const query = { companyId };
  if (filters.module) query.module = filters.module;
  if (filters.action) query.action = filters.action;
  if (filters.userId) query.userId = filters.userId;
  if (filters.status) query.status = filters.status;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const logs = await Audit.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'email');
  
  const total = await Audit.countDocuments(query);
  return { logs, total };
};

const getAuditLogById = async (id, companyId) => {
  return await Audit.findOne({ _id: id, companyId }).populate('userId', 'email');
};

module.exports = { log, logAction, getAllAuditLogs, getAuditLogById };
