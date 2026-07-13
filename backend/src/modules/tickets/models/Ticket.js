const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  ticketNumber: { type: String, required: true },
  qrCode: { type: String, required: true },
  status: { type: String, enum: ['valid', 'used', 'expired'], default: 'valid' },
  scannedAt: { type: Date }
}, { timestamps: true });

ticketSchema.index({ companyId: 1, ticketNumber: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
