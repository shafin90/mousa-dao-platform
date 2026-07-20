const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  fromStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  toStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  actualDepartureTime: { type: String },
  actualArrivalTime: { type: String },
  delayMinutes: { type: Number, default: 0 },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  seatsTotal: { type: Number, required: true },
  seatsBooked: { type: Number, default: 0 },
  status: { type: String, enum: ['scheduled', 'active', 'completed', 'cancelled'], default: 'scheduled' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

tripSchema.index({ companyId: 1, busId: 1, date: 1, departureTime: 1 }, { unique: true });

module.exports = mongoose.model('Trip', tripSchema);
