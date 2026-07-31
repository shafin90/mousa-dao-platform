const { Conversation, ChatMessage } = require('./chat.model');
const { respond } = require('../../utils/response');

exports.getMyConversations = async (req, res, next) => {
  try {
    const query = { companyId: req.user.companyId };
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    }
    const conversations = await Conversation.find(query)
      .populate('customerId', 'phone profile')
      .sort({ lastMessageAt: -1 });
    respond(res, 200, conversations);
  } catch (error) {
    next(error);
  }
};

exports.getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });
    if (!conversation) return respond(res, 404, null, 'Conversation not found');
    if (req.user.role === 'customer' && conversation.customerId.toString() !== req.user._id.toString()) {
      return respond(res, 403, null, 'Forbidden');
    }
    const messages = await ChatMessage.find({ conversationId: conversation._id })
      .populate('senderId', 'phone profile role')
      .sort({ createdAt: 1 });
    respond(res, 200, messages);
  } catch (error) {
    next(error);
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const existing = await Conversation.findOne({
      companyId: req.user.companyId,
      customerId: req.user._id,
      status: 'open',
    });
    if (existing) return respond(res, 200, existing);

    const conversation = await Conversation.create({
      companyId: req.user.companyId,
      customerId: req.user._id,
      customerPhone: req.user.phone,
      subject: req.body.subject || 'Support',
    });

    if (req.body.message) {
      await ChatMessage.create({
        companyId: req.user.companyId,
        conversationId: conversation._id,
        senderId: req.user._id,
        senderRole: 'customer',
        text: req.body.message,
      });
      conversation.lastMessage = req.body.message;
      conversation.lastMessageAt = new Date();
      conversation.unreadAgent = 1;
      await conversation.save();
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('customerId', 'phone profile');
    respond(res, 200, populated);
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const role = req.user.role === 'customer' ? 'customer' : 'agent';
    const updateField = role === 'customer' ? 'unreadCustomer' : 'unreadAgent';
    await Conversation.updateOne(
      { _id: req.params.id, companyId: req.user.companyId },
      { $set: { [updateField]: 0 } }
    );
    await ChatMessage.updateMany(
      { conversationId: req.params.id, readAt: null },
      { readAt: new Date() }
    );
    respond(res, 200, { success: true });
  } catch (error) {
    next(error);
  }
};
