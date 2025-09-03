const express = require('express');
const videoController = require('../controllers/videoController');
const videoService = require('../services/videoService');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);
router.post('/generate', videoController.submitVideoGeneration);
router.get('/job/:jobId', videoController.getJobStatus);
router.get('/user-jobs', videoController.getUserJobs);
router.post('/job/:jobId/cancel', videoController.cancelJob);
router.delete('/job/:jobId', videoController.deleteJob);
router.post('/start-processor', async (req, res) => {
  try {
    const io = req.app.get('io');
    videoService.startQueueProcessor(io);
    res.json({ success: true, message: 'Queue processor started' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
