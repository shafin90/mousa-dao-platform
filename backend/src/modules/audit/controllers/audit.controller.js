const auditRepository = require('../repositories/audit.repository');
const { respond, respondPaginated } = require('../../../utils/response');

const getAllAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await auditRepository.findMany(req.user.companyId, filters, Number(page) || 1, Number(limit) || 20);
    respondPaginated(res, data.logs, data.total, Number(page) || 1, Number(limit) || 20);
  } catch (error) { next(error); }
};

const getAuditLogById = async (req, res, next) => {
  try {
    const log = await auditRepository.findById(req.params.id, req.user.companyId);
    if (!log) return respond(res, 404, null, 'Audit log not found');
    respond(res, 200, log);
  } catch (error) { next(error); }
};

module.exports = { getAllAuditLogs, getAuditLogById };
