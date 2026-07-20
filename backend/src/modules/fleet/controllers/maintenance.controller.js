const maintenanceService = require('../services/maintenance.service');
const { respond } = require('../../../utils/response');

const getAllRecords = async (req, res, next) => {
  try {
    const { busId, facilityId, type } = req.query;
    const records = await maintenanceService.getAllRecords(req.user.companyId, { busId, facilityId, type });
    respond(res, 200, records);
  } catch (error) { next(error); }
};

const getRecordById = async (req, res, next) => {
  try {
    const record = await maintenanceService.getRecordById(req.params.id, req.user.companyId);
    if (!record) return respond(res, 404, null, 'Maintenance record not found');
    respond(res, 200, record);
  } catch (error) { next(error); }
};

const createRecord = async (req, res, next) => {
  try {
    const record = await maintenanceService.createRecord(req.user.companyId, req.body);
    respond(res, 201, record, 'Maintenance record created');
  } catch (error) { next(error); }
};

const updateRecord = async (req, res, next) => {
  try {
    const record = await maintenanceService.updateRecord(req.params.id, req.user.companyId, req.body);
    if (!record) return respond(res, 404, null, 'Maintenance record not found');
    respond(res, 200, record, 'Maintenance record updated');
  } catch (error) { next(error); }
};

const deleteRecord = async (req, res, next) => {
  try {
    const record = await maintenanceService.deleteRecord(req.params.id, req.user.companyId);
    if (!record) return respond(res, 404, null, 'Maintenance record not found');
    respond(res, 200, null, 'Maintenance record deleted');
  } catch (error) { next(error); }
};

module.exports = { getAllRecords, getRecordById, createRecord, updateRecord, deleteRecord };
