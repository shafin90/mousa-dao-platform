const { ChatMessage, Conversation } = require('./chat.model');

const handleChatSend = (io, socket) => async (data) => {
  try {
    const { conversationId, text } = data;
    if (!conversationId || !text) {
      return socket.emit('chat:error', { message: 'conversationId and text required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      companyId: socket.companyId,
    });
    if (!conversation) {
      console.error('[chat:send] Conversation not found:', conversationId, 'company:', socket.companyId, 'role:', socket.role, 'userId:', socket.userId);
      return socket.emit('chat:error', { message: 'Conversation not found' });
    }

    const message = await ChatMessage.create({
      companyId: socket.companyId,
      conversationId: conversation._id,
      senderId: socket.userId,
      senderRole: socket.role,
      text,
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();
    if (socket.role === 'customer') {
      conversation.unreadAgent += 1;
    } else {
      conversation.unreadCustomer += 1;
    }
    await conversation.save();

    const populated = await ChatMessage.findById(message._id)
      .populate('senderId', 'phone profile role');

    io.to(`company:${socket.companyId}`).emit('chat:message', populated);
    io.to(`company:${socket.companyId}`).emit('chat:conversation-updated', conversation);
  } catch (error) {
    console.error('[chat:send] Error:', error.message, error.stack);
    socket.emit('chat:error', { message: error.message });
  }
};

const handleChatHistory = (socket) => async (data) => {
  try {
    const { conversationId } = data;
    const messages = await ChatMessage.find({ conversationId, companyId: socket.companyId })
      .populate('senderId', 'phone profile role')
      .sort({ createdAt: 1 });
    socket.emit('chat:history', messages);
  } catch (error) {
    socket.emit('chat:error', { message: error.message });
  }
};

const handleChatMarkRead = (io, socket) => async (data) => {
  try {
    const { conversationId } = data;
    const isCustomer = socket.role === 'customer';
    const updateField = isCustomer ? 'unreadCustomer' : 'unreadAgent';
    await Conversation.updateOne(
      { _id: conversationId, companyId: socket.companyId },
      { $set: { [updateField]: 0 } }
    );
    await ChatMessage.updateMany(
      {
        conversationId,
        readAt: null,
        senderRole: isCustomer ? { $ne: 'customer' } : 'customer',
      },
      { readAt: new Date() }
    );
    io.to(`company:${socket.companyId}`).emit('chat:read', { conversationId, readBy: socket.role });
  } catch (error) {
    socket.emit('chat:error', { message: error.message });
  }
};

const registerChatHandlers = (io, socket) => {
  socket.on('chat:send', handleChatSend(io, socket));
  socket.on('chat:history', handleChatHistory(socket));
  socket.on('chat:mark-read', handleChatMarkRead(io, socket));
};

module.exports = { registerChatHandlers };
