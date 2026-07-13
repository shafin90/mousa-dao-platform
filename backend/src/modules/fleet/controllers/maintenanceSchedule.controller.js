const maintenanceScheduleService = require('../services/maintenanceSchedule.service');
const { respond } = require('../../../utils/response');

const getAllSchedules = async (req, res, next) => {
  try {
    const { busId } = req.query;
    const schedules = await maintenanceScheduleService.getAllSchedules(req.user.companyId, { busId });
    respond(res, 200, schedules);
  } catch (error) { next(error); }
};

const getScheduleById = async (req, res, next) => {
  try {
    const schedule = await maintenanceScheduleService.getScheduleById(req.params.id, req.user.companyId);
    if (!schedule) return respond(res, 404, null, 'Maintenance schedule not found');
    respond(res, 200, schedule);
  } catch (error) { next(error); }
};

const createSchedule = async (req, res, next) => {
  try {
    const schedule = await maintenanceScheduleService.createSchedule(req.user.companyId, req.body);
    respond(res, 201, schedule, 'Maintenance schedule created');
  } catch (error) { next(error); }
};

const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await maintenanceScheduleService.updateSchedule(req.params.id, req.user.companyId, req.body);
    if (!schedule) return respond(res, 404, null, 'Maintenance schedule not found');
    respond(res, 200, schedule, 'Maintenance schedule updated');
  } catch (error) { next(error); }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await maintenanceScheduleService.deleteSchedule(req.params.id, req.user.companyId);
    if (!schedule) return respond(res, 404, null, 'Maintenance schedule not found');
    respond(res, 200, null, 'Maintenance schedule deleted');
  } catch (error) { next(error); }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
