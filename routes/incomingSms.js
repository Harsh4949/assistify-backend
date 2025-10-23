const express = require('express');
const controller = require('../controllers/incomingSmsController');
const router = express.Router();

// @route   POST /api/v1/incoming-sms
router.post('/', controller.receiveSms);

module.exports = router;
