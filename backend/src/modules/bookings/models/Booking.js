const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  seats: [{ type: String }],
  bookingCode: { type: String },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' }
}, { timestamps: true });

bookingSchema.index({ companyId: 1, bookingCode: 1 }, { unique: true });

bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingCode) {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.bookingCode = `JET-${year}-${random}`;
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
