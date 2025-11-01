const express = require('express');
const controller = require('../controllers/incomingSmsController');
const router = express.Router();

router.post('/', controller.receiveSms);
router.get('/', controller.listSmsBySession);

module.exports = router;
