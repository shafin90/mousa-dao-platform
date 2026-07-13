const mongoose = require('mongoose');
const User = require('../../src/modules/users/models/User');

describe('User Model Schema Tests', () => {
  it('should create a user document successfully with valid fields', async () => {
    const userData = {
      email: 'user-schema-test@example.com',
      phone: '+18880009999',
      password: 'password123',
      role: 'customer',
      profile: {
        firstName: 'Jane',
        lastName: 'Doe'
      }
    };

    const user = await User.create(userData);
    expect(user._id).toBeDefined();
    expect(user.email).toBe('user-schema-test@example.com');
    expect(user.phone).toBe('+18880009999');
    expect(user.role).toBe('customer');
  });

  it('should enforce unique constraints on email', async () => {
    const email = 'duplicate-email@example.com';
    await User.create({
      email,
      phone: '+18881112222',
      password: 'password123'
    });

    await expect(User.create({
      email,
      phone: '+18883334444',
      password: 'password123'
    })).rejects.toThrow();
  });
});
