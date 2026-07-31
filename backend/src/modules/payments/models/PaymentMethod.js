const mongoose = require('mongoose');
const paymentMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  methodType: { type: String, enum: ['stripe', 'mobile_money'], required: true },
  provider: { type: String },
  last4: { type: String },
  expiryMonth: { type: Number },
  expiryYear: { type: Number },
  isDefault: { type: Boolean, default: false },
  stripePaymentMethodId: { type: String },
}, { timestamps: true });
paymentMethodSchema.index({ userId: 1 });
module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
