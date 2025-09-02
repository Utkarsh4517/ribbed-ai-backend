const avatarService = require('../services/avatarService');

class AvatarController {
  async createAvatar(req, res) {
    try {
      const { prompt } = req.body;
      const result = await avatarService.createAvatar(prompt);
      res.json(result);

    } catch (error) {
      console.error('Error creating avatar:', error);
      res.status(500).json({ 
        error: 'Failed to create avatar',
        message: error.message,
        details: error.toString()
      });
    }
  }

  async testReplicate(req, res) {
    try {
      const result = await avatarService.testReplicate();
      res.json(result);

    } catch (error) {
      console.error('Test replicate error:', error);
      res.status(500).json({
        success: false,
        error: 'Replicate connection failed',
        message: error.message
      });
    }
  }
}

module.exports = new AvatarController();