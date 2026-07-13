const refundRequestService = require('./refundRequest.service');

const getAll = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await refundRequestService.getAll(req.user.companyId, filters, parseInt(page) || 1, parseInt(limit) || 10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const refund = await refundRequestService.getById(req.params.id, req.user.companyId);
    if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found' });
    res.json({ success: true, data: refund });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const approve = async (req, res) => {
  try {
    const refund = await refundRequestService.approve(req.params.id, req.user.companyId, req.user._id, req.body.adminNote);
    res.json({ success: true, message: 'Refund approved', data: refund });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const reject = async (req, res) => {
  try {
    const refund = await refundRequestService.reject(req.params.id, req.user.companyId, req.user._id, req.body.adminNote);
    res.json({ success: true, message: 'Refund rejected', data: refund });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, approve, reject };
