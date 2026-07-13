const workOrderRepository = require('../repositories/workOrder.repository');
const Maintenance = require('../models/Maintenance');
const MaintenanceStaff = require('../models/MaintenanceStaff');

/**
 * Generates the next sequential work order number for a company (e.g. WO-0001).
 *
 * @param {string} companyId
 * @returns {Promise<string>}
 */
const generateWorkOrderNumber = async (companyId) => {
  const count = await workOrderRepository.countByCompany(companyId);
  return `WO-${String(count + 1).padStart(4, '0')}`;
};

/**
 * Normalizes nullable reference fields so empty strings become null / omitted.
 *
 * @param {Object} payload
 * @param {boolean} isUpdate
 */
const normalizeRefs = (payload, isUpdate) => {
  ['assignedTechnician', 'facilityId'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field) && !payload[field]) {
      if (isUpdate) {
        payload[field] = null;
      } else {
        delete payload[field];
      }
    }
  });
};

/**
 * Creates a Maintenance history record from a completed work order.
 *
 * @param {Object} workOrder - Populated work order document
 */
const createHistoryFromWorkOrder = async (workOrder) => {
  let performedBy = '';
  if (workOrder.assignedTechnician) {
    // assignedTechnician may be populated (object with name) or a raw id.
    if (typeof workOrder.assignedTechnician === 'object' && workOrder.assignedTechnician.name) {
      performedBy = workOrder.assignedTechnician.name;
    } else {
      const tech = await MaintenanceStaff.findOne({ _id: workOrder.assignedTechnician, companyId: workOrder.companyId });
      performedBy = tech ? tech.name : '';
    }
  }

  const busId = workOrder.busId && workOrder.busId._id ? workOrder.busId._id : workOrder.busId;
  const facilityId = workOrder.facilityId && workOrder.facilityId._id ? workOrder.facilityId._id : workOrder.facilityId;

  const payload = {
    companyId: workOrder.companyId,
    busId,
    facilityId,
    date: workOrder.completedAt || new Date(),
    type: workOrder.maintenanceType,
    description: workOrder.description || `Work order ${workOrder.workOrderNumber}`,
    cost: workOrder.cost || 0,
    odometer: workOrder.odometer,
    performedBy,
  };
  if (!payload.facilityId) delete payload.facilityId;
  await Maintenance.create(payload);
};

/**
 * Lists work orders for a company with optional filters.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getAllWorkOrders = async (companyId, filters) => {
  return await workOrderRepository.findAll(companyId, filters);
};

/**
 * Fetches a single work order by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getWorkOrderById = async (id, companyId) => {
  return await workOrderRepository.findById(id, companyId);
};

/**
 * Creates a work order (auto-generates the work order number).
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createWorkOrder = async (companyId, data) => {
  const payload = { ...data, companyId };
  normalizeRefs(payload, false);
  payload.workOrderNumber = await generateWorkOrderNumber(companyId);

  if (payload.status === 'completed') {
    payload.completedAt = new Date();
  }

  const workOrder = await workOrderRepository.create(payload);

  if (workOrder.status === 'completed') {
    await createHistoryFromWorkOrder(workOrder);
  }
  return workOrder;
};

/**
 * Updates a work order. Transitioning into `completed` sets completedAt and
 * creates a Maintenance history record.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateWorkOrder = async (id, companyId, data) => {
  const existing = await workOrderRepository.findById(id, companyId);
  if (!existing) return null;

  const payload = { ...data };
  normalizeRefs(payload, true);

  const transitioningToCompleted =
    payload.status === 'completed' && existing.status !== 'completed';
  if (transitioningToCompleted) {
    payload.completedAt = new Date();
  }

  const workOrder = await workOrderRepository.updateOne(id, companyId, payload);

  if (transitioningToCompleted && workOrder) {
    await createHistoryFromWorkOrder(workOrder);
  }
  return workOrder;
};

/**
 * Updates only the status of a work order (with completion side effects).
 *
 * @param {string} id
 * @param {string} companyId
 * @param {string} status
 * @returns {Promise<Object|null>}
 */
const updateStatus = async (id, companyId, status) => {
  return await updateWorkOrder(id, companyId, { status });
};

/**
 * Deletes a work order.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteWorkOrder = async (id, companyId) => {
  return await workOrderRepository.deleteOne(id, companyId);
};

module.exports = {
  getAllWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  updateStatus,
  deleteWorkOrder,
};
