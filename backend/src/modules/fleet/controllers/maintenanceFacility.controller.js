const maintenanceFacilityService = require('../services/maintenanceFacility.service');
const { respond } = require('../../../utils/response');

const getAllFacilities = async (req, res, next) => {
  try {
    const facilities = await maintenanceFacilityService.getAllFacilities(req.user.companyId);
    respond(res, 200, facilities);
  } catch (error) { next(error); }
};

const getFacilityById = async (req, res, next) => {
  try {
    const facility = await maintenanceFacilityService.getFacilityById(req.params.id, req.user.companyId);
    if (!facility) return respond(res, 404, null, 'Maintenance facility not found');
    respond(res, 200, facility);
  } catch (error) { next(error); }
};

const createFacility = async (req, res, next) => {
  try {
    const facility = await maintenanceFacilityService.createFacility(req.user.companyId, req.body);
    respond(res, 201, facility, 'Maintenance facility created');
  } catch (error) { next(error); }
};

const updateFacility = async (req, res, next) => {
  try {
    const facility = await maintenanceFacilityService.updateFacility(req.params.id, req.user.companyId, req.body);
    if (!facility) return respond(res, 404, null, 'Maintenance facility not found');
    respond(res, 200, facility, 'Maintenance facility updated');
  } catch (error) { next(error); }
};

const deleteFacility = async (req, res, next) => {
  try {
    const facility = await maintenanceFacilityService.deleteFacility(req.params.id, req.user.companyId);
    if (!facility) return respond(res, 404, null, 'Maintenance facility not found');
    respond(res, 200, null, 'Maintenance facility deleted');
  } catch (error) { next(error); }
};

const getFacilityMaintenance = async (req, res, next) => {
  try {
    const records = await maintenanceFacilityService.getFacilityMaintenance(req.params.id, req.user.companyId);
    respond(res, 200, records);
  } catch (error) { next(error); }
};

module.exports = {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  getFacilityMaintenance,
};
