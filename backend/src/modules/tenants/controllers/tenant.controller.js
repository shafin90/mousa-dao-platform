const tenantService = require('../services/tenant.service');
const { respond, respondPaginated } = require('../../../utils/response');

const createTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    respond(res, 201, tenant, 'Company created');
  } catch (error) { next(error); }
};

const getAllTenants = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await tenantService.getAllTenants(filters, Number(page) || 1, Number(limit) || 20);
    respondPaginated(res, data.tenants, data.total, Number(page) || 1, Number(limit) || 20);
  } catch (error) { next(error); }
};

const getTenantById = async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    respond(res, 200, tenant);
  } catch (error) { next(error); }
};

const updateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    if (!tenant) return respond(res, 404, null, 'Company not found');
    respond(res, 200, tenant, 'Company updated');
  } catch (error) { next(error); }
};

const suspendTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.suspendTenant(req.params.id);
    respond(res, 200, tenant, 'Company suspended');
  } catch (error) { next(error); }
};

const activateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.activateTenant(req.params.id);
    respond(res, 200, tenant, 'Company activated');
  } catch (error) { next(error); }
};

module.exports = { createTenant, getAllTenants, getTenantById, updateTenant, suspendTenant, activateTenant };
