const { replicate } = require('../config/replicate');

class AvatarService {
  async createAvatar(prompt) {
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const variations = [
      `Create a detailed portrait image of an avatar based on this request: ${prompt}. Make it suitable for a social media influencer, high quality, professional lighting, modern style`,
      `Generate a stylish avatar portrait: ${prompt}. Focus on trendy fashion, contemporary look, studio lighting, perfect for social media`,
      `Design a professional influencer avatar: ${prompt}. Emphasize charismatic expression, fashionable appearance, high-end photography style`,
      `Create an artistic avatar portrait: ${prompt}. Modern aesthetic, creative lighting, suitable for digital content creation`,
      `Generate a vibrant avatar image: ${prompt}. Bold colors, dynamic pose, professional quality, perfect for online presence`,
      `Design a sophisticated avatar: ${prompt}. Elegant styling, premium look, editorial photography quality, social media ready`
    ];

    const avatarImages = [];

    for (let i = 0; i < 6; i++) {
      try {
        console.log(`Generating avatar ${i + 1}/6...`);
        
        const output = await replicate.run("google/gemini-2.5-flash-image", {
          input: {
            prompt: variations[i],
            output_format: "jpg"
          }
        });

        const imageUrl = output;
        
        avatarImages.push({
          id: i + 1,
          name: `Avatar Variation ${i + 1}`,
          appearance: `Style ${i + 1}: ${variations[i].split(':')[1]?.split('.')[0]?.trim() || 'Modern avatar'}`,
          imageUrl: imageUrl,
          variation: i + 1
        });

        if (i < 5) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error generating avatar ${i + 1}:`, error);
        avatarImages.push({
          id: i + 1,
          name: `Avatar Variation ${i + 1}`,
          appearance: `Failed to generate variation ${i + 1}`,
          imageUrl: null,
          variation: i + 1,
          error: error.message
        });
      }
    }

    return {
      success: true,
      avatars: avatarImages,
      originalPrompt: prompt,
      totalGenerated: avatarImages.filter(avatar => avatar.imageUrl).length,
      totalRequested: 6
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