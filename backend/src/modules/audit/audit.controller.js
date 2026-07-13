const auditService = require('./audit.service');

const getAllAuditLogs = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await auditService.getAllAuditLogs(req.user.companyId, filters, parseInt(page) || 1, parseInt(limit) || 20);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuditLogById = async (req, res) => {
  try {
    const log = await auditService.getAuditLogById(req.params.id, req.user.companyId);
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAllAuditLogs, getAuditLogById };
