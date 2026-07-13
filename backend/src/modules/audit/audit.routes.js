const express = require('express');
const router = express.Router();
const auditController = require('./controllers/audit.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);
router.use(requireRole(['admin']));

router.get('/', auditController.getAllAuditLogs);
router.get('/:id', auditController.getAuditLogById);

module.exports = router;
