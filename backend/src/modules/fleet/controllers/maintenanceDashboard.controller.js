const maintenanceDashboardService = require('../services/maintenanceDashboard.service');
const { respond } = require('../../../utils/response');

const getOverview = async (req, res, next) => {
  try {
    const overview = await maintenanceDashboardService.getOverview(req.user.companyId);
    respond(res, 200, overview);
  } catch (error) { next(error); }
};

module.exports = { getOverview };
