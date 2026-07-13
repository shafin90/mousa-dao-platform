const tenantRepository = require('../repositories/tenant.repository');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Creates a new tenant (company).
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createTenant = async (data) => {
  const existing = await tenantRepository.findByEmail(data.email);
  if (existing) throw new AppError('A company with this email already exists', 409, ErrorCodes.TENANT_EXISTS);
  return await tenantRepository.create(data);
};

/**
 * Lists tenants with optional filters.
 *
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getAllTenants = async (filters, page, limit) => {
  return await tenantRepository.findMany(filters, page, limit);
};

/**
 * Fetches a tenant by ID.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const getTenantById = async (id) => {
  const tenant = await tenantRepository.findById(id);
  if (!tenant) throw new AppError('Company not found', 404, ErrorCodes.TENANT_NOT_FOUND);
  return tenant;
};

/**
 * Updates a tenant.
 *
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
const updateTenant = async (id, data) => {
  return await tenantRepository.updateOne(id, data);
};

/**
 * Suspends a tenant.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const suspendTenant = async (id) => {
  const tenant = await tenantRepository.updateOne(id, { status: 'suspended' });
  if (!tenant) throw new AppError('Company not found', 404, ErrorCodes.TENANT_NOT_FOUND);
  return tenant;
};

/**
 * Activates a tenant.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const activateTenant = async (id) => {
  const tenant = await tenantRepository.updateOne(id, { status: 'active' });
  if (!tenant) throw new AppError('Company not found', 404, ErrorCodes.TENANT_NOT_FOUND);
  return tenant;
};

module.exports = { createTenant, getAllTenants, getTenantById, updateTenant, suspendTenant, activateTenant };
