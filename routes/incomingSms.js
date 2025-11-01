const express = require('express');
const controller = require('../controllers/incomingSmsController');
const router = express.Router();

// Alias for legacy clients without the /api/v1 prefix
router.post('/incoming-sms', controller.receiveSms);
router.get('/incoming-sms', controller.listSmsBySession);

module.exports = router;
