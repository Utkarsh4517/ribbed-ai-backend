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

  async createScenes(avatarUrl) {
    if (!avatarUrl) {
      throw new Error('Avatar URL is required');
    }

    const scenes = [
      {
        name: "Cozy Cafe",
        prompt: "Place this person in a warm, cozy cafe setting. They should be sitting at a wooden table with a coffee cup, surrounded by soft lighting, books, and plants. The atmosphere should be relaxing and inviting with warm tones.",
        id: 1
      },
      {
        name: "Gym",
        prompt: "Show this person in a modern fitness gym. They should be in athletic wear, possibly near gym equipment like dumbbells or treadmills. The setting should be energetic with good lighting and a motivational atmosphere.",
        id: 2
      },
      {
        name: "Kitchen",
        prompt: "Place this person in a beautiful, modern kitchen. They could be cooking or preparing food, with fresh ingredients visible. The kitchen should be well-lit with contemporary appliances and a clean, organized look.",
        id: 3
      },
      {
        name: "Swimming Pool",
        prompt: "Show this person by or in a luxurious swimming pool. They should be in appropriate swimwear, with crystal clear blue water, poolside furniture, and bright, sunny lighting. The atmosphere should be relaxing and resort-like.",
        id: 4
      },
      {
        name: "Party",
        prompt: "Place this person at a vibrant party or celebration. They should be dressed festively, surrounded by colorful decorations, lights, and a fun party atmosphere. The mood should be energetic and celebratory.",
        id: 5
      }
    ];

    const sceneImages = [];

    for (let i = 0; i < scenes.length; i++) {
      try {
        console.log(`Generating scene ${i + 1}/5: ${scenes[i].name}...`);
        
        const output = await replicate.run("google/nano-banana", {
          input: {
            prompt: scenes[i].prompt,
            image_input: [avatarUrl]
          }
        });

        const imageUrl = output;
        
        sceneImages.push({
          id: scenes[i].id,
          name: scenes[i].name,
          description: scenes[i].prompt,
          imageUrl: imageUrl,
          originalAvatarUrl: avatarUrl
        });

        if (i < scenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (error) {
        console.error(`Error generating scene ${scenes[i].name}:`, error);
        sceneImages.push({
          id: scenes[i].id,
          name: scenes[i].name,
          description: `Failed to generate ${scenes[i].name} scene`,
          imageUrl: null,
          originalAvatarUrl: avatarUrl,
          error: error.message
        });
      }
    }

    return {
      success: true,
      scenes: sceneImages,
      originalAvatarUrl: avatarUrl,
      totalGenerated: sceneImages.filter(scene => scene.imageUrl).length,
      totalRequested: 5
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

  async testNanoBanana() {
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: 'A simple test with nano-banana model'
      }
    });

    const imageUrl = output;

    return {
      success: true,
      message: 'Nano-Banana connection successful',
      response: 'Test completed successfully',
      imageUrl: imageUrl
    };
  }
}

module.exports = new AvatarService();