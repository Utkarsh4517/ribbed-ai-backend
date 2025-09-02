const express = require('express');
const avatarController = require('../controllers/avatarController');

const router = express.Router();

router.post('/create-avatar', avatarController.createAvatar);
router.post('/create-scenes', avatarController.createScenes);
router.get('/test-replicate', avatarController.testReplicate);
router.get('/test-nano-banana', avatarController.testNanoBanana);

module.exports = router;