const workOrderService = require('../services/workOrder.service');
const { respond } = require('../../../utils/response');

const getAllWorkOrders = async (req, res, next) => {
  try {
    const { status, busId, priority } = req.query;
    const workOrders = await workOrderService.getAllWorkOrders(req.user.companyId, { status, busId, priority });
    respond(res, 200, workOrders);
  } catch (error) { next(error); }
};

const getWorkOrderById = async (req, res, next) => {
  try {
    const workOrder = await workOrderService.getWorkOrderById(req.params.id, req.user.companyId);
    if (!workOrder) return respond(res, 404, null, 'Work order not found');
    respond(res, 200, workOrder);
  } catch (error) { next(error); }
};

const createWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await workOrderService.createWorkOrder(req.user.companyId, req.body);
    respond(res, 201, workOrder, 'Work order created');
  } catch (error) { next(error); }
};

const updateWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await workOrderService.updateWorkOrder(req.params.id, req.user.companyId, req.body);
    if (!workOrder) return respond(res, 404, null, 'Work order not found');
    respond(res, 200, workOrder, 'Work order updated');
  } catch (error) { next(error); }
};

const updateWorkOrderStatus = async (req, res, next) => {
  try {
    const workOrder = await workOrderService.updateStatus(req.params.id, req.user.companyId, req.body.status);
    if (!workOrder) return respond(res, 404, null, 'Work order not found');
    respond(res, 200, workOrder, 'Work order status updated');
  } catch (error) { next(error); }
};

const deleteWorkOrder = async (req, res, next) => {
  try {
    const workOrder = await workOrderService.deleteWorkOrder(req.params.id, req.user.companyId);
    if (!workOrder) return respond(res, 404, null, 'Work order not found');
    respond(res, 200, null, 'Work order deleted');
  } catch (error) { next(error); }
};

module.exports = {
  getAllWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
  deleteWorkOrder,
};
