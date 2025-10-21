const express = require('express');
const controller = require('../controllers/messageController');
const router = express.Router();

router.post('/', controller.enqueueMessage);
router.get('/:id', controller.getMessage);

module.exports = router;
