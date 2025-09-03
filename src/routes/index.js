const express = require('express');
const authRoutes = require('./authRoutes');
const avatarRoutes = require('./avatarRoutes');
const healthRoutes = require('./healthRoutes');
const ttsRoutes = require('./ttsRoutes');
const videoRoutes = require('./videoRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/', avatarRoutes);
router.use('/', healthRoutes);
router.use('/tts', ttsRoutes);
router.use('/video', videoRoutes);

module.exports = router;