const avatarService = require('../services/avatarService');

class AvatarController {
  async getPublicAvatars(req, res) {
    try {
      const result = await avatarService.getPublicAvatars();
      res.json(result);
    } catch (error) {
      console.error('Error fetching public avatars:', error);
      res.status(500).json({ 
        error: 'Failed to fetch public avatars',
        message: error.message
      });
    }
  }

  async getAvatarScenes(req, res) {
    try {
      const { avatarId } = req.params;
      
      if (!avatarId) {
        return res.status(400).json({ error: 'Avatar ID is required' });
      }

      const result = await avatarService.getScenesForAvatar(parseInt(avatarId));
      res.json(result);
    } catch (error) {
      console.error('Error fetching avatar scenes:', error);
      res.status(500).json({ 
        error: 'Failed to fetch avatar scenes',
        message: error.message
      });
    }
  }

  async saveAvatarWithScenes(req, res) {
    try {
      const { avatarData, scenesData } = req.body;
      const userId = req.user?.id;
      
      if (!avatarData || !scenesData) {
        return res.status(400).json({ 
          error: 'Avatar data and scenes data are required' 
        });
      }

      const result = await avatarService.saveAvatarWithScenes(
        avatarData, 
        scenesData, 
        userId
      );
      res.status(201).json(result);
    } catch (error) {
      console.error('Error saving avatar with scenes:', error);
      res.status(500).json({ 
        error: 'Failed to save avatar with scenes',
        message: error.message
      });
    }
  }

  async saveAvatar(req, res) {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
      }

      const savedAvatar = await avatarService.saveAvatar(imageUrl);
      res.status(201).json(savedAvatar);

    } catch (error) {
      console.error('Error saving avatar:', error);
      res.status(500).json({ 
        error: 'Failed to save avatar',
        message: error.message
      });
    }
  }

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

  async createCustomScenes(req, res) {
    try {
      const { avatarUrl, customScenes } = req.body;
      
      if (!avatarUrl) {
        return res.status(400).json({ error: 'Avatar URL is required' });
      }

      if (!customScenes || !Array.isArray(customScenes)) {
        return res.status(400).json({ error: 'Custom scenes array is required' });
      }

      if (customScenes.length > 6) {
        return res.status(400).json({ error: 'Maximum 6 custom scenes allowed' });
      }

      // Validate each scene has required fields
      for (let scene of customScenes) {
        if (!scene.name || !scene.description) {
          return res.status(400).json({ 
            error: 'Each scene must have a name and description' 
          });
        }
      }

      const userId = req.user?.id;
      const io = req.app.get('io');
      const result = await avatarService.createCustomScenes(avatarUrl, customScenes, userId, io);
      res.json(result);

    } catch (error) {
      console.error('Error creating custom scenes:', error);
      res.status(500).json({ 
        error: 'Failed to create custom scenes',
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