const ttsService = require('../services/ttsService');

class TTSController {
  async generateSpeech(req, res) {
    try {
      const { text, voice, stability, similarity_boost, speed, timestamps } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }

      if (text.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'Text is too long. Maximum 5000 characters allowed.'
        });
      }

      const options = {
        voice,
        stability,
        similarity_boost,
        speed,
        timestamps
      };

      const result = await ttsService.generateSpeech(text, options);

      res.json(result);

    } catch (error) {
      console.error('TTS Controller Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate speech'
      });
    }
  }

  async generateSpeechStream(req, res) {
    try {
      const { text, voice, stability, similarity_boost, speed } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }

      if (text.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'Text is too long. Maximum 5000 characters allowed.'
        });
      }

      const options = {
        voice,
        stability,
        similarity_boost,
        speed
      };

      const stream = await ttsService.generateSpeechStream(text, options);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');
      for await (const event of stream) {
        res.write(JSON.stringify(event) + '\n');
      }

      const result = await stream.done();
      
      res.write(JSON.stringify({
        type: 'final',
        data: {
          success: true,
          audioUrl: result.data.audio.url,
          timestamps: result.data.timestamps || [],
          requestId: result.requestId
        }
      }) + '\n');

      res.end();

    } catch (error) {
      console.error('TTS Stream Controller Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate speech stream'
      });
    }
  }
}

module.exports = new TTSController();
