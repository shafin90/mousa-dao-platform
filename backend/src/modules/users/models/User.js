const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  email2: { type: String, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  phone2: { type: String, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'staff', 'driver', 'customer'], default: 'customer' },
  dateOfBirth: { type: Date },
  employmentStatus: { type: String, enum: ['active', 'inactive', 'on_leave', 'terminated'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  authTracking: {
    lastLogin: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false }
  }
}, { timestamps: true });

userSchema.index({ companyId: 1, email: 1 }, { unique: true });
userSchema.index({ companyId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
