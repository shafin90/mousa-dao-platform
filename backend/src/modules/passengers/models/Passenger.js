const mongoose = require('mongoose');
const passengerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  dateOfBirth: { type: Date },
  idType: { type: String, enum: ['national_id', 'passport', 'driver_license'] },
  idNumber: { type: String },
}, { timestamps: true });
passengerSchema.index({ userId: 1 });
module.exports = mongoose.model('Passenger', passengerSchema);
