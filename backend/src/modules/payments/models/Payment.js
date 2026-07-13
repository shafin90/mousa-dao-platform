const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['wave', 'orange_money', 'mtn', 'moov', 'flutterwave'], required: true },
  transactionId: { type: String, sparse: true },
  tx_ref: { type: String, required: true },
  paymentLink: { type: String },
  providerResponse: { type: mongoose.Schema.Types.Mixed },
  amount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'expired'], 
    default: 'pending' 
  }
}, { timestamps: true });

paymentSchema.index({ companyId: 1, tx_ref: 1 }, { unique: true });
paymentSchema.index({ companyId: 1, transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
