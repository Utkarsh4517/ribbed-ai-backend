const { fal } = require("@fal-ai/client");
const config = require('../config');

fal.config({
  credentials: config.FAL_KEY
});

class TTSService {
  async generateSpeech(text, options = {}) {
    try {
      const {
        voice = "Aria",
        stability = 0.5,
        similarity_boost = 0.75,
        speed = 1,
        timestamps = false
      } = options;

      console.log('Generating speech for text:', text.substring(0, 100) + '...');

      const result = await fal.subscribe("fal-ai/elevenlabs/tts/eleven-v3", {
        input: {
          text,
          voice,
          stability,
          similarity_boost,
          speed,
          timestamps
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('TTS generation completed');
      console.log('Request ID:', result.requestId);

      return {
        success: true,
        audioUrl: result.data.audio.url,
        timestamps: result.data.timestamps || [],
        requestId: result.requestId
      };

    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  async generateSpeechStream(text, options = {}) {
    try {
      const {
        voice = "Aria",
        stability = 0.5,
        similarity_boost = 0.75,
        speed = 1
      } = options;

      console.log('Starting streaming speech generation for text:', text.substring(0, 100) + '...');

      const stream = await fal.stream("fal-ai/elevenlabs/tts/eleven-v3", {
        input: {
          text,
          voice,
          stability,
          similarity_boost,
          speed
        }
      });

      return stream;

    } catch (error) {
      console.error('Error starting speech stream:', error);
      throw new Error(`Failed to start speech stream: ${error.message}`);
    }
  }
}

module.exports = new TTSService();

