const express = require('express');
const controller = require('../controllers/deviceController');
const router = express.Router();

router.post('/register', controller.register);
router.post('/heartbeat', controller.heartbeat);
router.post('/ack', controller.ack);
router.post('/sms-result', controller.smsResult);

module.exports = router;
