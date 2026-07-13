const User = require('../../backend/src/modules/users/models/User');
const Tenant = require('../../backend/src/modules/tenants/models/Tenant');
const jwt = require('jsonwebtoken');

const createTestTenant = async (overrides = {}) => {
  const tenant = await Tenant.create({
    name: overrides.name || `Test Co ${Date.now()}`,
    email: overrides.email || `tenant-${Date.now()}@example.com`,
    phone: overrides.phone || `+12345${Math.floor(Math.random() * 1000000)}`,
    plan: overrides.plan || 'basic',
    status: overrides.status || 'active',
  });
  return tenant;
};

const createTestUser = async (profileData = {}, role = 'customer', tenant = null) => {
  if (!tenant) {
    tenant = await createTestTenant();
  }

  const email = `test-${Math.random().toString(36).substring(2, 10)}@example.com`;
  const phone = `+12345${Math.floor(Math.random() * 1000000)}`;
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await User.create({
    companyId: tenant._id,
    email,
    phone,
    password: hashedPassword,
    role,
    profile: {
      firstName: profileData.firstName || 'Test',
      lastName: profileData.lastName || 'User',
    },
  });

  const token = jwt.sign(
    { id: user._id, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  return { user, token, tenant };
};

const createAdminUser = async (tenant = null) => {
  return createTestUser({}, 'admin', tenant);
};

const createStaffUser = async (tenant = null) => {
  return createTestUser({}, 'staff', tenant);
};

const createDriverUser = async (tenant = null) => {
  return createTestUser({}, 'driver', tenant);
};

const getAuthHeader = (token) => `Bearer ${token}`;

module.exports = {
  createTestTenant,
  createTestUser,
  createAdminUser,
  createStaffUser,
  createDriverUser,
  getAuthHeader,
};
