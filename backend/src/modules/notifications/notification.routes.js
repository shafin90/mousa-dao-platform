const express = require('express');
const router = express.Router();
const notificationController = require('./controllers/notification.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/', requireRole(['admin']), notificationController.getAllNotifications);
router.get('/my', notificationController.getMyNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
