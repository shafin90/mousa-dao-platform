const refundRequestService = require('../services/refundRequest.service');
const { respond, respondPaginated } = require('../../../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await refundRequestService.getAll(req.user.companyId, filters, Number(page) || 1, Number(limit) || 10);
    respondPaginated(res, data.refunds, data.total, Number(page) || 1, Number(limit) || 10);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const refund = await refundRequestService.getById(req.params.id, req.user.companyId);
    if (!refund) return respond(res, 404, null, 'Refund request not found');
    respond(res, 200, refund);
  } catch (error) { next(error); }
};

const approve = async (req, res, next) => {
  try {
    const refund = await refundRequestService.approve(req.params.id, req.user.companyId, req.user._id, req.body.adminNote);
    respond(res, 200, refund, 'Refund approved');
  } catch (error) { next(error); }
};

const reject = async (req, res, next) => {
  try {
    const refund = await refundRequestService.reject(req.params.id, req.user.companyId, req.user._id, req.body.adminNote);
    respond(res, 200, refund, 'Refund rejected');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, approve, reject };
