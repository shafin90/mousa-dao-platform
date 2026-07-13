const maintenanceService = require('../services/maintenance.service');
const { respond } = require('../../../utils/response');

const getAllRecords = async (req, res, next) => {
  try {
    const { busId, facilityId, type } = req.query;
    const records = await maintenanceService.getAllRecords(req.user.companyId, { busId, facilityId, type });
    respond(res, 200, records);
  } catch (error) { next(error); }
};

module.exports = { getAllRecords };
