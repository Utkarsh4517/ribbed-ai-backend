const { replicate } = require('../config/replicate');

class AvatarService {
  async createAvatar(prompt) {
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const variations = [
      `Create a realistic human avatar front facing to camera (Dont show the mobile): ${prompt}. Front-facing camera angle, natural selfie pose, realistic facial features, authentic lighting, high quality portrait. generate the output by editing the input image`,
      `Generate a realistic selfie-style avatar (Dont show the mobile): ${prompt}. Direct eye contact with camera, natural human appearance, front-facing angle, realistic skin texture and features. generate the output by editing the input image`,
      `Design a realistic human selfie avatar front facing to camera (Dont show the mobile): ${prompt}. Front camera perspective, genuine human expression, natural lighting, photorealistic quality, authentic portrait style. generate the output by editing the input image`,
      `Create a front-facing realistic avatar front facing to camera (Dont show the mobile): ${prompt}. Natural human features, direct camera gaze, realistic proportions, authentic selfie angle and lighting. generate the output by editing the input image`,
      `Generate a realistic human portrait selfie front facing to camera (Dont show the mobile): ${prompt}. Front-facing camera view, natural expression, photorealistic human features, genuine selfie composition. generate the output by editing the input image`,
      `Design a realistic selfie camera avatar front facing to camera (Dont show the mobile): ${prompt}. Human appearance, front-facing angle, natural pose, realistic facial details, authentic selfie lighting and perspective. generate the output by editing the input image`
    ];

    const avatarImages = [];

    for (let i = 0; i < 6; i++) {
      try {
        console.log(`Generating avatar ${i + 1}/6...`);
        const output = await replicate.run("google/nano-banana", {
          input: {
            prompt: variations[i],
            image_input: ["https://enjaqtorkhhaopdzsdir.supabase.co/storage/v1/object/public/frames/Frame%201%20from%20Figma.png"]
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
        prompt: "Place this ultra-realistic human avatar in the horizontal center of a warm, cozy cafe setting, vertical portrait orientation. They should be sitting at a wooden table with a coffee cup, surrounded by soft lighting, books, and plants. The atmosphere should be relaxing and inviting with warm tones. Ultra-realistic human features, photorealistic quality.",
        id: 1
      },
      {
        name: "Gym",
        prompt: "Show this ultra-realistic human avatar centered horizontally in a modern fitness gym, vertical portrait format. They should be in athletic wear, possibly near gym equipment like dumbbells or treadmills. The setting should be energetic with good lighting and a motivational atmosphere. Photorealistic human appearance.",
        id: 2
      },
      {
        name: "Kitchen",
        prompt: "Place this ultra-realistic human avatar in the horizontal center of a beautiful, modern kitchen, vertical portrait orientation. They could be cooking or preparing food, with fresh ingredients visible. The kitchen should be well-lit with contemporary appliances and a clean, organized look. Ultra-realistic human features.",
        id: 3
      },
      {
        name: "Swimming Pool",
        prompt: "Show this ultra-realistic human avatar centered horizontally by a luxurious swimming pool, vertical portrait format. They should be in appropriate swimwear, with crystal clear blue water, poolside furniture, and bright, sunny lighting. The atmosphere should be relaxing and resort-like. Photorealistic human quality.",
        id: 4
      },
      {
        name: "Party",
        prompt: "Place this ultra-realistic human avatar in the horizontal center at a vibrant party or celebration, vertical portrait orientation. They should be dressed festively, surrounded by colorful decorations, lights, and a fun party atmosphere. The mood should be energetic and celebratory. Ultra-realistic human appearance.",
        id: 5
      },
      {
        name: "Office Workspace",
        prompt: "Position this ultra-realistic human avatar horizontally centered in a modern office workspace, vertical portrait format. They should be at a desk with laptop, office supplies, and professional lighting. Clean, contemporary office environment. Photorealistic human features.",
        id: 6
      },
      {
        name: "Beach Sunset",
        prompt: "Show this ultra-realistic human avatar centered horizontally on a beautiful beach at sunset, vertical portrait orientation. Golden hour lighting, ocean waves in background, relaxed beach attire. Warm, romantic atmosphere with ultra-realistic human appearance.",
        id: 7
      },
      {
        name: "City Rooftop",
        prompt: "Place this ultra-realistic human avatar in the horizontal center on a stylish city rooftop, vertical portrait format. Urban skyline background, modern rooftop setting, evening lighting. Sophisticated urban vibe with photorealistic human quality.",
        id: 8
      },
      {
        name: "Bookstore Library",
        prompt: "Position this ultra-realistic human avatar horizontally centered in a cozy bookstore or library, vertical portrait orientation. Surrounded by bookshelves, reading nook, warm ambient lighting. Intellectual, peaceful atmosphere with ultra-realistic human features.",
        id: 9
      },
      {
        name: "Art Gallery",
        prompt: "Show this ultra-realistic human avatar centered horizontally in a contemporary art gallery, vertical portrait format. Modern artworks on walls, gallery lighting, sophisticated cultural setting. Elegant atmosphere with photorealistic human appearance.",
        id: 10
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