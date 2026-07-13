const MaintenanceSchedule = require('../models/MaintenanceSchedule');

const POPULATE = { path: 'busId', select: 'busNumber name odometer' };

/**
 * Lists maintenance schedules for a company (newest first), optionally filtered.
 *
 * @param {string} companyId
 * @param {Object} filters - Optional { busId, isActive }
 * @returns {Promise<Array>}
 */
const findAll = async (companyId, filters = {}) => {
  const query = { companyId };
  if (filters.busId) query.busId = filters.busId;
  if (typeof filters.isActive === 'boolean') query.isActive = filters.isActive;
  return await MaintenanceSchedule.find(query).populate(POPULATE).sort({ createdAt: -1 });
};

/**
 * Finds a maintenance schedule by ID scoped to company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const findById = async (id, companyId) => {
  return await MaintenanceSchedule.findOne({ _id: id, companyId }).populate(POPULATE);
};

/**
 * Creates a maintenance schedule record.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const schedule = await MaintenanceSchedule.create(data);
  return await MaintenanceSchedule.findById(schedule._id).populate(POPULATE);
};

/**
 * Updates a maintenance schedule by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} update
 * @returns {Promise<Object|null>}
 */
const updateOne = async (id, companyId, update) => {
  return await MaintenanceSchedule.findOneAndUpdate({ _id: id, companyId }, update, { new: true }).populate(POPULATE);
};

/**
 * Deletes a maintenance schedule by ID and company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteOne = async (id, companyId) => {
  return await MaintenanceSchedule.findOneAndDelete({ _id: id, companyId });
};

module.exports = { findAll, findById, create, updateOne, deleteOne };
