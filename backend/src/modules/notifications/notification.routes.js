const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const ctrl = require('./notification.controller');

const router = Router();

router.use(authenticate);
router.get('/', ctrl.getMyNotifications);
router.post('/read-all', ctrl.markAllRead);
router.post('/:id/read', ctrl.markRead);

module.exports = router;
