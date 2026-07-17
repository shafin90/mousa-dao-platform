require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tenantData = {
  name: 'Default Company',
  email: 'admin@company.com',
  phone: '+22600000000',
  status: 'active',
  plan: 'pro',
};

const adminData = {
  email: 'admin@test.com',
  phone: '+22600000001',
  password: 'password',
  role: 'admin',
  profile: { firstName: 'Admin', lastName: 'User' },
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });
  console.log('✓ Connected to MongoDB');

  const Tenant = require('./src/modules/tenants/models/Tenant');
  let tenant = await Tenant.findOne({ email: tenantData.email });
  if (!tenant) {
    tenant = await Tenant.create(tenantData);
    console.log('✓ Created tenant:', tenant.name);
  } else {
    console.log('✓ Tenant already exists:', tenant.name);
  }

  const User = require('./src/modules/users/models/User');
  let user = await User.findOne({ email: adminData.email });
  if (!user) {
    const hashed = await bcrypt.hash(adminData.password, 10);
    user = await User.create({
      email: adminData.email,
      phone: adminData.phone,
      password: hashed,
      role: adminData.role,
      companyId: tenant._id,
      profile: adminData.profile,
    });
    console.log('✓ Created admin user:', user.email);
  } else {
    console.log('✓ Admin user already exists:', user.email);
  }

  await mongoose.disconnect();
  console.log('✓ Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
