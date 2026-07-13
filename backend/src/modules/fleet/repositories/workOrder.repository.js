const WorkOrder = require('../models/WorkOrder');

const POPULATE = [
  { path: 'busId', select: 'busNumber name' },
  { path: 'assignedTechnician', select: 'name' },
  { path: 'facilityId', select: 'name' },
];

/**
 * Lists work orders for a company (newest first), with optional filters.
 *
 * @param {string} companyId
 * @param {Object} filters - Optional { status, busId, priority }
 * @returns {Promise<Array>}
 */
const findAll = async (companyId, filters = {}) => {
  const query = { companyId };
  if (filters.status) query.status = filters.status;
  if (filters.busId) query.busId = filters.busId;
  if (filters.priority) query.priority = filters.priority;
  return await WorkOrder.find(query).populate(POPULATE).sort({ createdAt: -1 });
};

/**
 * Finds a work order by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await WorkOrder.findOne({ _id: id, companyId }).populate(POPULATE);
};

/**
 * Counts work orders for a company (used for sequential numbering).
 *
 * @param {string} companyId
 * @returns {Promise<number>}
 */
const countByCompany = async (companyId) => {
  return await WorkOrder.countDocuments({ companyId });
};

/**
 * Creates a work order record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const workOrder = await WorkOrder.create(data);
  return await WorkOrder.findById(workOrder._id).populate(POPULATE);
};

/**
 * Updates a work order by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await WorkOrder.findOneAndUpdate({ _id: id, companyId }, update, { new: true }).populate(POPULATE);
};

/**
 * Deletes a work order by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await WorkOrder.findOneAndDelete({ _id: id, companyId });
};

module.exports = { findAll, findById, countByCompany, create, updateOne, deleteOne };
