const express = require('express');
const controller = require('../controllers/sessionController');
const router = express.Router();

router.post('/', controller.createSession);
router.post('/:id/stop', controller.stopSession);
router.get('/:id', controller.getSession);

module.exports = router;
