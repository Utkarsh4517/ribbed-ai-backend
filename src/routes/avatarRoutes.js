const express = require('express');
const avatarController = require('../controllers/avatarController');

const router = express.Router();

router.post('/create-avatar', avatarController.createAvatar);
router.post('/save-avatar', avatarController.saveAvatar);
router.post('/create-scenes', avatarController.createScenes);
router.get('/public-avatars', avatarController.getPublicAvatars);
router.get('/avatar/:avatarId/scenes', avatarController.getAvatarScenes);
router.post('/save-avatar-with-scenes', avatarController.saveAvatarWithScenes);
router.get('/test-replicate', avatarController.testReplicate);
router.get('/test-nano-banana', avatarController.testNanoBanana);
router.post('/create-custom-scenes', avatarController.createCustomScenes);

module.exports = router;