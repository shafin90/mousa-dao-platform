const busRepository = require('../repositories/bus.repository');
const Maintenance = require('../models/Maintenance');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Creates a new bus for a company.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createBus = async (companyId, data) => {
  return await busRepository.create({ ...data, companyId });
};

/**
 * Lists buses for a company with pagination.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getAllBuses = async (companyId, filters, page, limit) => {
  return await busRepository.findMany(companyId, filters, page, limit);
};

/**
 * Fetches a single bus by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getBusById = async (id, companyId) => {
  const bus = await busRepository.findById(id, companyId);
  if (!bus) throw new AppError('Bus not found', 404, ErrorCodes.BUS_NOT_FOUND);
  return bus;
};

/**
 * Updates bus details.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateBus = async (id, companyId, data) => {
  return await busRepository.updateOne(id, companyId, data);
};

/**
 * Updates bus operational status.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {string} status
 * @returns {Promise<Object|null>}
 */
const updateBusStatus = async (id, companyId, status) => {
  return await busRepository.updateOne(id, companyId, { status });
};

/**
 * Assigns a driver to a bus.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {string} driverId
 * @returns {Promise<Object|null>}
 */
const assignDriver = async (id, companyId, driverId) => {
  return await busRepository.updateOne(id, companyId, { assignedDriver: driverId });
};

/**
 * Adds a maintenance log entry for a bus.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const addMaintenanceLog = async (id, companyId, data) => {
  const bus = await busRepository.findById(id, companyId);
  if (!bus) throw new AppError('Bus not found', 404, ErrorCodes.BUS_NOT_FOUND);
  return await Maintenance.create({ ...data, companyId, busId: id });
};

/**
 * Lists maintenance log entries for a bus (most recent first).
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getMaintenanceLogs = async (id, companyId) => {
  return await Maintenance.find({ busId: id, companyId }).sort({ date: -1 });
};

/**
 * Deletes a bus by ID within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteBus = async (id, companyId) => {
  return await busRepository.deleteOne(id, companyId);
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, updateBusStatus, assignDriver, addMaintenanceLog, getMaintenanceLogs, deleteBus };
