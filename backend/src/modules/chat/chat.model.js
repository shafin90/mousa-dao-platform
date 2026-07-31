const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer', 'admin', 'manager', 'staff'], required: true },
  text: { type: String, required: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

const conversationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerPhone: { type: String },
  subject: { type: String, default: 'Support' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  lastMessageAt: { type: Date },
  lastMessage: { type: String },
  unreadCustomer: { type: Number, default: 0 },
  unreadAgent: { type: Number, default: 0 },
}, { timestamps: true });

conversationSchema.index({ companyId: 1, status: 1 });
conversationSchema.index({ customerId: 1, status: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { ChatMessage, Conversation };
