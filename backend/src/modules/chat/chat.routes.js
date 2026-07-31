const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const ctrl = require('./chat.controller');

const router = Router();

router.use(authenticate);
router.get('/conversations', ctrl.getMyConversations);
router.post('/conversations', ctrl.createConversation);
router.get('/conversations/:id/messages', ctrl.getConversationMessages);
router.post('/conversations/:id/read', ctrl.markRead);

module.exports = router;
