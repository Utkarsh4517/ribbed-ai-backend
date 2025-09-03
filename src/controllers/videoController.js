const videoService = require('../services/videoService');

class VideoController {
  async submitVideoGeneration(req, res) {
    try {
      const { sceneData, audioUrl } = req.body;
      const userId = req.user.id;
      if (!sceneData || !audioUrl) {
        return res.status(400).json({
          success: false,
          error: 'Scene data and audio URL are required'
        });
      }

      if (!sceneData.imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'Scene image URL is required'
        });
      }

      if (!sceneData.name || !sceneData.description) {
        return res.status(400).json({
          success: false,
          error: 'Scene must have name and description'
        });
      }

      if (!audioUrl.startsWith('http')) {
        return res.status(400).json({
          success: false,
          error: 'Audio URL must be a valid HTTP URL'
        });
      }

      console.log(`Submitting video generation for user ${userId}`);
      console.log(`Scene: ${sceneData.name}`);
      console.log(`Audio URL: ${audioUrl}`);

      const job = await videoService.submitVideoGeneration(userId, sceneData, audioUrl);
      
      res.json({
        success: true,
        jobId: job.jobId,
        status: job.status,
        message: 'Video generation job submitted successfully',
        estimatedTime: '2-5 minutes' // Provide user expectation
      });

    } catch (error) {
      console.error('Video submission error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit video generation'
      });
    }
  }

  async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      
      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: 'Job ID is required'
        });
      }

      const job = await videoService.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      if (job.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this job'
        });
      }

      res.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          videoUrl: job.videoUrl,
          duration: job.duration,
          error: job.error,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
          updatedAt: job.updatedAt,
          sceneData: job.sceneData
        }
      });

    } catch (error) {
      console.error('Get job status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get job status'
      });
    }
  }

  async getUserJobs(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;
      
      console.log(`Fetching jobs for user ${userId}`);
      
      const jobs = await videoService.getUserJobs(userId, {
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      const jobsByStatus = {
        pending: jobs.filter(job => job.status === 'pending'),
        'in-progress': jobs.filter(job => job.status === 'in-progress'),
        completed: jobs.filter(job => job.status === 'completed'),
        failed: jobs.filter(job => job.status === 'failed')
      };

      res.json({
        success: true,
        jobs,
        jobsByStatus,
        total: jobs.length,
        user: {
          id: userId,
          email: req.user.email
        }
      });

    } catch (error) {
      console.error('Get user jobs error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user jobs'
      });
    }
  }

  async cancelJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      
      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: 'Job ID is required'
        });
      }

      const job = await videoService.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      if (job.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this job'
        });
      }

      if (!['pending', 'in-progress'].includes(job.status)) {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel job with status: ${job.status}`
        });
      }

      await videoService.cancelJob(jobId);
      
      res.json({
        success: true,
        message: 'Job cancelled successfully'
      });

    } catch (error) {
      console.error('Cancel job error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel job'
      });
    }
  }

  async deleteJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;
      
      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: 'Job ID is required'
        });
      }

      const job = await videoService.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      if (job.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this job'
        });
      }

      await videoService.deleteJob(jobId);
      
      res.json({
        success: true,
        message: 'Job deleted successfully'
      });

    } catch (error) {
      console.error('Delete job error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete job'
      });
    }
  }
}

module.exports = new VideoController();