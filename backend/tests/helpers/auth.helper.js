const mongoose = require('mongoose');
const User = require('../../src/modules/users/models/User');
const jwt = require('jsonwebtoken');

const createTestUser = async (profileData = {}, role = 'customer', companyId = null) => {
  const email = `test-${Math.random()}@example.com`;
  const phone = `+12345${Math.floor(Math.random() * 1000000)}`;
  const password = '$2a$10$abcdefghijklmnopqrstuvwxy';
  const cid = companyId || new mongoose.Types.ObjectId();

  const user = await User.create({
    email,
    phone,
    password,
    role,
    companyId: cid,
    profile: {
      firstName: profileData.firstName || 'Test',
      lastName: profileData.lastName || 'User'
    }
  });

  const token = jwt.sign({ id: user._id, role: user.role, companyId: String(cid) }, process.env.JWT_SECRET || 'testsecret');
  return { user, token, companyId: cid };
};

module.exports = { createTestUser };
