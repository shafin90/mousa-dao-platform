const express = require('express');
const router = express.Router();
const configController = require('./controllers/config.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/', configController.getConfig);
router.patch('/', requireRole(['admin']), configController.updateConfig);
router.post('/reset', requireRole(['admin']), configController.resetConfig);

module.exports = router;
