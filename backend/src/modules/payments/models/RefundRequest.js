const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  adminNote: { type: String },
}, { timestamps: true });

refundRequestSchema.virtual('requestId').get(function () {
  return `RR-${this._id.toString().slice(-8).toUpperCase()}`;
});

refundRequestSchema.set('toJSON', { virtuals: true });
refundRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RefundRequest', refundRequestSchema);
