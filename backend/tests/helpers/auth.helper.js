const User = require('../../src/modules/users/models/User');
const jwt = require('jsonwebtoken');

const createTestUser = async (profileData = {}, role = 'customer') => {
  const email = `test-${Math.random()}@example.com`;
  const phone = `+12345${Math.floor(Math.random() * 1000000)}`;
  const password = '$2a$10$abcdefghijklmnopqrstuvwxy'; // pre-hashed password
  
  const user = await User.create({
    email,
    phone,
    password,
    role,
    profile: {
      firstName: profileData.firstName || 'Test',
      lastName: profileData.lastName || 'User'
    }
  });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'testsecret');
  return { user, token };
};

module.exports = { createTestUser };
