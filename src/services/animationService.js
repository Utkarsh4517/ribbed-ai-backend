const { replicate } = require('../config/replicate');
const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('../config/redis');
const { supabase } = require('../config/database');

class AnimationService {
  async animateScene(sceneData, userId, io) {
    if (!sceneData || !sceneData.imageUrl) {
      throw new Error('Scene data with image URL is required');
    }

    const animationId = uuidv4();
    const animationData = {
      id: animationId,
      userId,
      sceneId: sceneData.id,
      sceneImageUrl: sceneData.imageUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const redis = getRedisClient();

    try {
      await redis.setEx(`animation_job:${animationId}`, 3600, JSON.stringify(animationData));
      await redis.sAdd(`user_animations:${userId}`, animationId);
      const { error } = await supabase
        .from('scene_animations')
        .insert([{
          id: animationId,
          user_id: userId,
          scene_id: sceneData.id,
          scene_image_url: sceneData.imageUrl,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
        
      if (error) {
        console.error('Supabase insert error for animation:', error);
      }

      io.to(`user:${userId}`).emit('animationStatusUpdate', {
        animationId,
        sceneId: sceneData.id,
        status: 'pending',
        message: 'Starting animation generation...'
      });

      console.log(`Starting animation for scene ${sceneData.id} (${sceneData.name})`);

      animationData.status = 'in-progress';
      animationData.updatedAt = new Date().toISOString();
      await redis.setEx(`animation_job:${animationId}`, 3600, JSON.stringify(animationData));
      
      await supabase
        .from('scene_animations')
        .update({ 
          status: 'in-progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', animationId);

      io.to(`user:${userId}`).emit('animationStatusUpdate', {
        animationId,
        sceneId: sceneData.id,
        status: 'in-progress',
        message: 'Generating animated avatar...'
      });

      const input = {
        image: sceneData.imageUrl,
        prompt: "Make the avatar in this scene talk"
      };

      const output = await replicate.run("wan-video/wan-2.2-i2v-fast", { input });

      const animatedVideoUrl = output;
      animationData.status = 'completed';
      animationData.animatedVideoUrl = animatedVideoUrl;
      animationData.completedAt = new Date().toISOString();
      animationData.updatedAt = new Date().toISOString();
      await redis.setEx(`animation_job:${animationId}`, 86400, JSON.stringify(animationData)); // Keep for 24 hours
      await supabase
        .from('scene_animations')
        .update({ 
          status: 'completed',
          animated_video_url: animatedVideoUrl,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', animationId);
      io.to(`user:${userId}`).emit('animationStatusUpdate', {
        animationId,
        sceneId: sceneData.id,
        status: 'completed',
        message: 'Animation completed successfully',
        animatedVideoUrl: animatedVideoUrl
      });

      console.log(`Animation completed for scene ${sceneData.id}: ${animatedVideoUrl}`);

      return {
        success: true,
        animationId,
        sceneId: sceneData.id,
        animatedVideoUrl: animatedVideoUrl
      };

    } catch (error) {
      console.error(`Error animating scene ${sceneData.id}:`, error);
      animationData.status = 'failed';
      animationData.error = error.message;
      animationData.updatedAt = new Date().toISOString();

      await redis.setEx(`animation_job:${animationId}`, 86400, JSON.stringify(animationData));
      
      await supabase
        .from('scene_animations')
        .update({ 
          status: 'failed',
          error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', animationId);

      io.to(`user:${userId}`).emit('animationStatusUpdate', {
        animationId,
        sceneId: sceneData.id,
        status: 'failed',
        message: 'Animation generation failed',
        error: error.message
      });

      throw error;
    }
  }

  async animateMultipleScenes(scenes, userId, io) {
    const results = [];
    
    for (const scene of scenes) {
      if (scene.imageUrl) { 
        try {
          const result = await this.animateScene(scene, userId, io);
          results.push(result);
          if (scenes.indexOf(scene) < scenes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`Failed to animate scene ${scene.id}:`, error);
          results.push({
            success: false,
            sceneId: scene.id,
            error: error.message
          });
        }
      }
    }

    return {
      success: true,
      animations: results,
      totalAnimated: results.filter(r => r.success).length,
      totalRequested: scenes.filter(s => s.imageUrl).length
    };
  }

  async getAnimationStatus(animationId) {
    const redis = getRedisClient();
    const animationDataStr = await redis.get(`animation_job:${animationId}`);
    
    if (!animationDataStr) {
      throw new Error('Animation job not found');
    }

    return JSON.parse(animationDataStr);
  }

  async getUserAnimations(userId) {
    try {
      const { data, error } = await supabase
        .from('scene_animations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        animations: data
      };
    } catch (error) {
      console.error('Error fetching user animations:', error);
      throw error;
    }
  }
}

module.exports = new AnimationService();
