const tenantService = require('./tenant.service');

const createTenant = async (req, res) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json({ success: true, message: 'Company created', data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllTenants = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await tenantService.getAllTenants(filters, parseInt(page) || 1, parseInt(limit) || 20);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTenantById = async (req, res) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTenant = async (req, res) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    if (!tenant) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company updated', data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const suspendTenant = async (req, res) => {
  try {
    const tenant = await tenantService.suspendTenant(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company suspended', data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const activateTenant = async (req, res) => {
  try {
    const tenant = await tenantService.activateTenant(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company activated', data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { createTenant, getAllTenants, getTenantById, updateTenant, suspendTenant, activateTenant };
