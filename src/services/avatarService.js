const { replicate } = require('../config/replicate');

class AvatarService {
  async createAvatar(prompt) {
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const enhancedPrompt = `Create a detailed portrait image of an avatar based on this request: ${prompt}. Make it suitable for a social media influencer, high quality, professional lighting, modern style`;

    const output = await replicate.run("google/gemini-2.5-flash-image", {
      input: {
        prompt: enhancedPrompt,
        output_format: "jpg"
      }
    });

    const imageUrl = output;

    const avatarData = {
      name: "Generated Avatar",
      appearance: `AI-generated avatar based on: ${prompt}`,
      imageUrl: imageUrl
    };

    return {
      success: true,
      avatar: avatarData,
      originalPrompt: prompt,
      imageUrl: imageUrl
    };
  }

  async testReplicate() {
    const output = await replicate.run("google/gemini-2.5-flash-image", {
      input: {
        prompt: 'A simple test image of a smiling person',
        output_format: "jpg"
      }
    });

    const imageUrl = output;

    return {
      success: true,
      message: 'Replicate connection successful',
      response: 'Image generated successfully',
      imageUrl: imageUrl
    };
  }
}

module.exports = new AvatarService();