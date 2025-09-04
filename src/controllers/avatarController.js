const avatarService = require('../services/avatarService');

class AvatarController {
  async createAvatar(req, res) {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

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

  async createScenes(req, res) {
    try {
      const { avatarUrl } = req.body;
      
      if (!avatarUrl) {
        return res.status(400).json({ error: 'Avatar URL is required' });
      }
      const userId = req.user?.id;
      const io = req.app.get('io');
      const result = await avatarService.createScenes(avatarUrl, userId, io);
      res.json(result);

    } catch (error) {
      console.error('Error creating scenes:', error);
      res.status(500).json({ 
        error: 'Failed to create scenes',
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

  async testNanoBanana(req, res) {
    try {
      const result = await avatarService.testNanoBanana();
      res.json(result);

    } catch (error) {
      console.error('Test nano-banana error:', error);
      res.status(500).json({
        success: false,
        error: 'Nano-Banana connection failed',
        message: error.message
      });
    }
  }
}

module.exports = new AvatarController();