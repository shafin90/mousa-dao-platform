const express = require('express');
const router = express.Router();
const refundRequestController = require('./controllers/refundRequest.controller');
const { authenticate } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/my', refundRequestController.getMyRefunds);
router.post('/', refundRequestController.requestRefund);

module.exports = router;
