const maintenanceStaffService = require('../services/maintenanceStaff.service');
const { respond } = require('../../../utils/response');

const getAllStaff = async (req, res, next) => {
  try {
    const staff = await maintenanceStaffService.getAllStaff(req.user.companyId);
    respond(res, 200, staff);
  } catch (error) { next(error); }
};

const getStaffById = async (req, res, next) => {
  try {
    const staff = await maintenanceStaffService.getStaffById(req.params.id, req.user.companyId);
    if (!staff) return respond(res, 404, null, 'Maintenance staff not found');
    respond(res, 200, staff);
  } catch (error) { next(error); }
};

const createStaff = async (req, res, next) => {
  try {
    const staff = await maintenanceStaffService.createStaff(req.user.companyId, req.body);
    respond(res, 201, staff, 'Maintenance staff created');
  } catch (error) { next(error); }
};

const updateStaff = async (req, res, next) => {
  try {
    const staff = await maintenanceStaffService.updateStaff(req.params.id, req.user.companyId, req.body);
    if (!staff) return respond(res, 404, null, 'Maintenance staff not found');
    respond(res, 200, staff, 'Maintenance staff updated');
  } catch (error) { next(error); }
};

const deleteStaff = async (req, res, next) => {
  try {
    const staff = await maintenanceStaffService.deleteStaff(req.params.id, req.user.companyId);
    if (!staff) return respond(res, 404, null, 'Maintenance staff not found');
    respond(res, 200, null, 'Maintenance staff deleted');
  } catch (error) { next(error); }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};
