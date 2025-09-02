const express = require('express');
const avatarController = require('../controllers/avatarController');

const router = express.Router();

router.post('/create-avatar', avatarController.createAvatar);
router.get('/test-replicate', avatarController.testReplicate);

module.exports = router;