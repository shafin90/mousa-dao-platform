const express = require('express');
const router = express.Router();
const deviceController = require('./device.controller');
const { authenticate } = require('../auth/auth.middleware');

router.use(authenticate);

router.post('/register', deviceController.registerDevice);
router.post('/unregister', deviceController.unregisterDevice);

module.exports = router;
