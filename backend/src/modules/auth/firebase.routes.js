const express = require('express');
const router = express.Router();
const firebaseController = require('./firebase.controller');

router.post('/firebase', firebaseController.firebaseLogin);

module.exports = router;
