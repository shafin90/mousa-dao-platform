const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../users/models/User');
const Tenant = require('../tenants/models/Tenant');

const register = async (userData) => {
  const { name, password, companyId, ...rest } = userData;

  if (companyId) {
    const tenant = await Tenant.findById(companyId);
    if (!tenant) throw new Error('Company not found');
    if (tenant.status !== 'active') throw new Error('Company is suspended');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [firstName = name, ...lastParts] = (name || '').split(' ');
  const lastName = lastParts.join(' ') || '';

  const user = await User.create({
    ...rest,
    companyId,
    password: hashedPassword,
    profile: { firstName, lastName }
  });

  const token = jwt.sign(
    { id: user._id, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    user: { id: user._id, email: user.email, role: user.role, companyId: user.companyId },
    token
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  if (user.authTracking?.isLocked) {
    throw new Error('Account is locked');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    user: {
      id: user._id,
      name: user.profile?.firstName,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    },
    token
  };
};

module.exports = { register, login };
