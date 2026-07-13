require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'driver', 'customer'], default: 'customer' },
  profile: { firstName: String, lastName: String, avatar: String },
  authTracking: { lastLogin: Date, failedLoginAttempts: { type: Number, default: 0 }, isLocked: { type: Boolean, default: false } }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) {
    console.log('Admin user already exists');
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    email: 'admin@example.com',
    phone: '0000000000',
    password: hashedPassword,
    role: 'admin',
    profile: { firstName: 'Admin', lastName: 'User' },
  });

  console.log('Admin user created: admin@example.com / admin123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
