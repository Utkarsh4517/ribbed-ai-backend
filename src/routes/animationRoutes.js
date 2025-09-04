const express = require('express');
const animationController = require('../controllers/animationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/status/:animationId', authMiddleware, animationController.getAnimationStatus);
router.get('/user-animations', authMiddleware, animationController.getUserAnimations);
router.post('/animate-scene', authMiddleware, animationController.animateScene);

module.exports = router;
