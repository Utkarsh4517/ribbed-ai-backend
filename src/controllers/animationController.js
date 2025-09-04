const animationService = require('../services/animationService');

class AnimationController {
  async getAnimationStatus(req, res) {
    try {
      const { animationId } = req.params;
      
      if (!animationId) {
        return res.status(400).json({ error: 'Animation ID is required' });
      }

      const result = await animationService.getAnimationStatus(animationId);
      res.json({
        success: true,
        animation: result
      });

    } catch (error) {
      console.error('Error getting animation status:', error);
      res.status(500).json({ 
        error: 'Failed to get animation status',
        message: error.message
      });
    }
  }

  async getUserAnimations(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await animationService.getUserAnimations(userId);
      res.json(result);

    } catch (error) {
      console.error('Error getting user animations:', error);
      res.status(500).json({ 
        error: 'Failed to get user animations',
        message: error.message
      });
    }
  }

  async animateScene(req, res) {
    try {
      const { sceneData } = req.body;
      const userId = req.user?.id;
      const io = req.app.get('io');
      
      if (!sceneData) {
        return res.status(400).json({ error: 'Scene data is required' });
      }

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const result = await animationService.animateScene(sceneData, userId, io);
      
      res.json(result);

    } catch (error) {
      console.error('Error animating scene:', error);
      res.status(500).json({ 
        error: 'Failed to animate scene',
        message: error.message
      });
    }
  }
}

module.exports = new AnimationController();