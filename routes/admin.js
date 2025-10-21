const express = require('express');
const controller = require('../controllers/adminController');
const router = express.Router();

router.get('/metrics', controller.getMetrics);
router.post('/ping/:deviceId', controller.pingDevice);

module.exports = router;
