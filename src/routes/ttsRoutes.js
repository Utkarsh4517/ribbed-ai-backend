const express = require('express');
const ttsController = require('../controllers/ttsController');

const router = express.Router();
router.post('/generate-speech', ttsController.generateSpeech);
router.post('/generate-speech-stream', ttsController.generateSpeechStream);

module.exports = router;
