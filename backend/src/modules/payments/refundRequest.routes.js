const express = require('express');
const router = express.Router();
const refundRequestController = require('./controllers/refundRequest.controller');
const { authenticate, requireRole } = require('../auth/auth.middleware');

router.use(authenticate);
router.use(requireRole(['admin']));

router.get('/', refundRequestController.getAll);
router.get('/:id', refundRequestController.getById);
router.patch('/:id/approve', refundRequestController.approve);
router.patch('/:id/reject', refundRequestController.reject);

module.exports = router;
