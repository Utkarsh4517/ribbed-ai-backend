const { fal } = require("@fal-ai/client");
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { getRedisClient } = require('../config/redis');
const { supabase } = require('../config/database');

fal.config({
  credentials: config.FAL_KEY
});

class VideoService {
  async submitVideoGeneration(userId, sceneData, audioUrl) {
    const redis = getRedisClient();
    const jobId = uuidv4();
    
    const jobData = {
      id: jobId,
      userId,
      sceneData,
      audioUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Store job in Redis
      await redis.setex(`video_job:${jobId}`, 3600, JSON.stringify(jobData));
      // Add to user's job list
      await redis.sadd(`user_jobs:${userId}`, jobId);
      // Add to pending queue
      await redis.lpush('video_queue:pending', jobId);
      // Store in Supabase for persistence
      const { error } = await supabase
        .from('video_generations')
        .insert([{
          id: jobId,
          user_id: userId,
          scene_data: sceneData,
          audio_url: audioUrl,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      if (error) {
        console.error('Supabase insert error:', error);
      }
      console.log(`Video job ${jobId} submitted for user ${userId}`);
      return { jobId, ...jobData };
    } catch (error) {
      console.error('Error submitting video job:', error);
      throw error;
    }
  }

  async processVideoGeneration(jobId, io) {
    const redis = getRedisClient();
    try {
      // Get job data
      const jobDataStr = await redis.get(`video_job:${jobId}`);
      if (!jobDataStr) {
        throw new Error('Job not found');
      }
      const jobData = JSON.parse(jobDataStr);
      // Update status to in-progress
      jobData.status = 'in-progress';
      jobData.updatedAt = new Date().toISOString();
      await redis.setex(`video_job:${jobId}`, 3600, JSON.stringify(jobData));
      // Update Supabase
      await supabase
        .from('video_generations')
        .update({ 
          status: 'in-progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      // Emit status update
      io.to(`user:${jobData.userId}`).emit('videoStatusUpdate', {
        jobId,
        status: 'in-progress',
        message: 'Starting video generation...'
      });
      console.log(`Processing video generation for job ${jobId}`);
      // Submit to fal.ai
      const result = await fal.subscribe("fal-ai/bytedance/omnihuman", {
        input: {
          image_url: jobData.sceneData.imageUrl,
          audio_url: jobData.audioUrl
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // Emit progress updates
            io.to(`user:${jobData.userId}`).emit('videoStatusUpdate', {
              jobId,
              status: 'in-progress',
              message: update.logs?.[update.logs.length - 1]?.message || 'Processing...',
              progress: update.progress || null
            });
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      // Update job with result
      jobData.status = 'completed';
      jobData.videoUrl = result.data.video.url;
      jobData.duration = result.data.duration;
      jobData.completedAt = new Date().toISOString();
      jobData.updatedAt = new Date().toISOString();
      await redis.setex(`video_job:${jobId}`, 86400, JSON.stringify(jobData)); // 24 hours
      // Update Supabase
      await supabase
        .from('video_generations')
        .update({ 
          status: 'completed',
          video_url: result.data.video.url,
          duration: result.data.duration,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      // Emit completion
      io.to(`user:${jobData.userId}`).emit('videoStatusUpdate', {
        jobId,
        status: 'completed',
        videoUrl: result.data.video.url,
        duration: result.data.duration,
        message: 'Video generation completed!'
      });
      console.log(`Video generation completed for job ${jobId}`);
      return jobData;

    } catch (error) {
      console.error(`Error processing video job ${jobId}:`, error);
      // Update job status to failed
      const jobDataStr = await redis.get(`video_job:${jobId}`);
      if (jobDataStr) {
        const jobData = JSON.parse(jobDataStr);
        jobData.status = 'failed';
        jobData.error = error.message;
        jobData.updatedAt = new Date().toISOString();
        await redis.setex(`video_job:${jobId}`, 3600, JSON.stringify(jobData));
        await supabase
          .from('video_generations')
          .update({ 
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        // Emit failure
        io.to(`user:${jobData.userId}`).emit('videoStatusUpdate', {
          jobId,
          status: 'failed',
          error: error.message,
          message: 'Video generation failed'
        });
      }
      throw error;
    }
  }

  async getJobStatus(jobId) {
    const redis = getRedisClient();
    const jobDataStr = await redis.get(`video_job:${jobId}`);
    if (!jobDataStr) {
      const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .eq('id', jobId)
        .single();
      if (error || !data) {
        return null;
      }
      return {
        id: data.id,
        userId: data.user_id,
        sceneData: data.scene_data,
        audioUrl: data.audio_url,
        status: data.status,
        videoUrl: data.video_url,
        duration: data.duration,
        error: data.error_message,
        createdAt: data.created_at,
        completedAt: data.completed_at,
        updatedAt: data.updated_at
      };
    }
    return JSON.parse(jobDataStr);
  }

  async getUserJobs(userId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;
      
      let query = supabase
        .from('video_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(job => ({
        id: job.id,
        userId: job.user_id,
        sceneData: job.scene_data,
        audioUrl: job.audio_url,
        status: job.status,
        videoUrl: job.video_url,
        duration: job.duration,
        error: job.error_message,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        updatedAt: job.updated_at
      }));
    } catch (error) {
      console.error('Error fetching user jobs:', error);
      throw error;
    }
  }

  async cancelJob(jobId) {
    const redis = getRedisClient();
    
    try {
      const jobDataStr = await redis.get(`video_job:${jobId}`);
      if (jobDataStr) {
        const jobData = JSON.parse(jobDataStr);
        jobData.status = 'cancelled';
        jobData.updatedAt = new Date().toISOString();
        await redis.setex(`video_job:${jobId}`, 3600, JSON.stringify(jobData));
      }

      await supabase
        .from('video_generations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      await redis.lrem('video_queue:pending', 0, jobId);
      console.log(`Job ${jobId} cancelled`);
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  async deleteJob(jobId) {
    const redis = getRedisClient();
    
    try {
      // Remove from Redis
      await redis.del(`video_job:${jobId}`);
      
      // Remove from Supabase
      await supabase
        .from('video_generations')
        .delete()
        .eq('id', jobId);

      console.log(`Job ${jobId} deleted`);
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  async startQueueProcessor(io) {
    const redis = getRedisClient();
    console.log('Starting video queue processor...');
    const processQueue = async () => {
      try {
        const jobId = await redis.brpop('video_queue:pending', 1);
        if (jobId && jobId[1]) {
          console.log(`Processing job: ${jobId[1]}`);
          await this.processVideoGeneration(jobId[1], io);
        }
      } catch (error) {
        console.error('Queue processing error:', error);
      }
      setTimeout(processQueue, 1000);
    };
    processQueue();
  }
}

module.exports = new VideoService();
