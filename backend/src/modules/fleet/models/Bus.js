const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  busNumber: { type: String, required: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  type: { type: String, enum: ['VIP', 'Premium', 'Mini', 'Standard'], required: true },
  features: { type: mongoose.Schema.Types.Mixed, default: {} },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },

  // Managers
  busManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maintenanceManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Vehicle identity
  make: { type: String },
  model: { type: String },
  year: { type: Number },
  color: { type: String },
  plateNumber: { type: String },
  vin: { type: String },
  fuelType: { type: String, enum: ['diesel', 'petrol', 'electric', 'hybrid', 'cng'] },
  odometer: { type: Number },

  // Registration
  registrationNumber: { type: String },

  // Compliance & documents
  registrationExpiry: { type: Date },
  insuranceProvider: { type: String },
  insurancePolicyNumber: { type: String },
  insuranceIssueDate: { type: Date },
  insuranceExpiry: { type: Date },
  fitnessExpiry: { type: Date },
  lastInspectionDate: { type: Date },

  // Service
  firstServiceDate: { type: Date },
  matriculationDate: { type: Date },

  // Purchase & acquisition
  purchaseDate: { type: Date },
  purchaseCost: { type: Number },
  homeDepot: { type: String },

  // Media
  photos: { type: [String], default: [] },
}, { timestamps: true });

busSchema.index({ companyId: 1, busNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bus', busSchema);
