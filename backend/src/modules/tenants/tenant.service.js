const Tenant = require('./models/Tenant');

const createTenant = async (data) => {
  const existing = await Tenant.findOne({ email: data.email });
  if (existing) throw new Error('A company with this email already exists');
  return await Tenant.create(data);
};

const getAllTenants = async (filters = {}, page = 1, limit = 20) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.plan) query.plan = filters.plan;

  const tenants = await Tenant.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Tenant.countDocuments(query);
  return { tenants, total };
};

const getTenantById = async (id) => {
  return await Tenant.findById(id);
};

const updateTenant = async (id, data) => {
  return await Tenant.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const suspendTenant = async (id) => {
  return await Tenant.findByIdAndUpdate(id, { status: 'suspended' }, { new: true });
};

const activateTenant = async (id) => {
  return await Tenant.findByIdAndUpdate(id, { status: 'active' }, { new: true });
};

module.exports = { createTenant, getAllTenants, getTenantById, updateTenant, suspendTenant, activateTenant };
