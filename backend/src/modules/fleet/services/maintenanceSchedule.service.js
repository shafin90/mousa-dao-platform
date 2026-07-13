const maintenanceScheduleRepository = require('../repositories/maintenanceSchedule.repository');

const KM_DUE_THRESHOLD = 500;
const MONTHS_DUE_THRESHOLD_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Adds a number of whole months to a date.
 *
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Computes the derived status and next-due info for a schedule document.
 * Status is NOT stored; it is derived from the bus odometer / last service.
 *
 * @param {Object} schedule - Plain schedule object (busId may be populated)
 * @returns {Object} schedule augmented with { status, nextDue, ...extras }
 */
const computeScheduleStatus = (schedule) => {
  const base = typeof schedule.toObject === 'function' ? schedule.toObject() : { ...schedule };

  if (base.isActive === false) {
    return { ...base, status: 'completed', nextDue: null };
  }

  if (base.intervalType === 'km') {
    const busOdometer = (base.busId && typeof base.busId === 'object' && base.busId.odometer) || 0;
    const nextDueOdometer = (base.lastServiceOdometer || 0) + (base.intervalValue || 0);
    const remaining = nextDueOdometer - busOdometer;
    let status = 'upcoming';
    if (remaining < 0) status = 'overdue';
    else if (remaining <= KM_DUE_THRESHOLD) status = 'due';
    return {
      ...base,
      status,
      nextDueOdometer,
      remainingKm: remaining,
      nextDue: nextDueOdometer,
    };
  }

  // intervalType === 'months'
  const lastServiceDate = base.lastServiceDate ? new Date(base.lastServiceDate) : new Date(base.createdAt || Date.now());
  const nextDueDate = addMonths(lastServiceDate, base.intervalValue || 0);
  const daysRemaining = Math.ceil((nextDueDate.getTime() - Date.now()) / MS_PER_DAY);
  let status = 'upcoming';
  if (daysRemaining < 0) status = 'overdue';
  else if (daysRemaining <= MONTHS_DUE_THRESHOLD_DAYS) status = 'due';
  return {
    ...base,
    status,
    nextDueDate,
    daysRemaining,
    nextDue: nextDueDate,
  };
};

/**
 * Lists maintenance schedules for a company, each with computed status.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
const getAllSchedules = async (companyId, filters = {}) => {
  const schedules = await maintenanceScheduleRepository.findAll(companyId, filters);
  return schedules.map(computeScheduleStatus);
};

/**
 * Fetches a single schedule with computed status.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getScheduleById = async (id, companyId) => {
  const schedule = await maintenanceScheduleRepository.findById(id, companyId);
  return schedule ? computeScheduleStatus(schedule) : null;
};

/**
 * Creates a maintenance schedule.
 *
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createSchedule = async (companyId, data) => {
  const schedule = await maintenanceScheduleRepository.create({ ...data, companyId });
  return computeScheduleStatus(schedule);
};

/**
 * Updates a maintenance schedule.
 *
 * @param {string} id
 * @param {string} companyId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateSchedule = async (id, companyId, data) => {
  const schedule = await maintenanceScheduleRepository.updateOne(id, companyId, data);
  return schedule ? computeScheduleStatus(schedule) : null;
};

/**
 * Deletes a maintenance schedule.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const deleteSchedule = async (id, companyId) => {
  return await maintenanceScheduleRepository.deleteOne(id, companyId);
};

module.exports = {
  computeScheduleStatus,
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
