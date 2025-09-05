const { replicate } = require("../config/replicate");
const animationService = require("./animationService");
const { supabase } = require("../config/database");
const crypto = require("crypto");
class AvatarService {
  async persistExternalImage(externalUrl, folder = "misc") {
    if (!externalUrl) return null;
    try {
      const res = await fetch(externalUrl, { redirect: 'follow' });
      if (!res.ok) {
        if (res.status === 404) return externalUrl;
        throw new Error(`Failed to fetch external image: ${res.status}`);
      }
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const arrayBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const hash = crypto.createHash("sha1").update(buf).digest("hex");
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
        ? "webp"
        : "jpeg";

      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "generated";
      const filePath = `${folder}/${hash}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, buf, { contentType, upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      return pub.publicUrl;
    } catch (e) {
      console.error("persistExternalImage error:", e);
      return externalUrl;
    }
  }
  async getPublicAvatars() {
    try {
      const { data, error } = await supabase
        .from('public_avatars')
        .select(`
          id,
          image_url,
          original_prompt,
          appearance_description,
          usage_count,
          created_at
        `)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(20);
  
      if (error) {
        console.error('Error fetching public avatars:', error);
        throw new Error('Failed to fetch public avatars');
      }
  
      const migrated = await Promise.all((data || []).map(async (row) => {
        if (row.image_url && !row.image_url.includes('supabase.co/storage')) {
          const stored = await this.persistExternalImage(row.image_url, 'avatars');
          try {
            await supabase.from('public_avatars').update({ image_url: stored }).eq('id', row.id);
          } catch (e) {
            console.warn('Failed to update migrated avatar url:', e.message);
          }
          return { ...row, image_url: stored };
        }
        return row;
      }));
  
      return {
        success: true,
        avatars: migrated
      };
    } catch (error) {
      console.error('Error in getPublicAvatars:', error);
      throw error;
    }
  }

  async getScenesForAvatar(avatarId) {
    try {
      const { data, error } = await supabase
        .from('avatar_scenes')
        .select(`
          id,
          scene_name,
          scene_description,
          image_url,
          scene_order
        `)
        .eq('avatar_id', avatarId)
        .eq('is_successful', true)
        .order('scene_order', { ascending: true });
  
      if (error) {
        console.error('Error fetching scenes for avatar:', error);
        throw new Error('Failed to fetch scenes');
      }
  
      const migrated = await Promise.all((data || []).map(async (row) => {
        if (row.image_url && !row.image_url.includes('supabase.co/storage')) {
          const stored = await this.persistExternalImage(row.image_url, 'scenes');
          try {
            await supabase.from('avatar_scenes').update({ image_url: stored }).eq('id', row.id);
          } catch (e) {
            console.warn('Failed to update migrated scene url:', e.message);
          }
          return { ...row, image_url: stored };
        }
        return row;
      }));
  
      return {
        success: true,
        scenes: migrated
      };
    } catch (error) {
      console.error('Error in getScenesForAvatar:', error);
      throw error;
    }
  }

  async saveAvatarWithScenes(avatarData, scenesData, userId = null) {
    try {
      const normalize = async (url, folder) => {
        if (!url) return null;
        const isSupabase = url.includes('supabase.co/storage');
        return isSupabase ? url : await this.persistExternalImage(url, folder);
      };
  
      const normalizedAvatarUrl = await normalize(avatarData.imageUrl, 'avatars');
      const { data: avatarResult, error: avatarError } = await supabase
        .from('public_avatars')
        .upsert([{
          image_url: normalizedAvatarUrl,
          original_prompt: avatarData.originalPrompt || null,
          variation_number: avatarData.variation || 1,
          appearance_description: avatarData.appearance || null
        }], {
          onConflict: 'image_url',
          ignoreDuplicates: false
        })
        .select()
        .single();
  
      if (avatarError) {
        console.error('Error saving avatar:', avatarError);
        throw new Error('Failed to save avatar');
      }
  
      const avatarId = avatarResult.id;
  
      const scenesToSave = await Promise.all(scenesData.map(async (scene, index) => ({
        avatar_id: avatarId,
        scene_name: scene.name,
        scene_description: scene.description,
        image_url: await normalize(scene.imageUrl, 'scenes'),
        scene_order: scene.id || (index + 1),
        is_successful: !!scene.imageUrl
      })));
  
      const { error: scenesError } = await supabase
        .from('avatar_scenes')
        .upsert(scenesToSave, {
          onConflict: 'avatar_id,scene_order',
          ignoreDuplicates: false
        });
  
      if (scenesError) {
        console.error('Error saving scenes:', scenesError);
        throw new Error('Failed to save scenes');
      }

      try {
        await supabase.rpc("increment_usage_count", { avatar_id: avatarId });
      } catch (rpcError) {
        console.warn(
          "RPC increment failed, using fallback method:",
          rpcError.message
        );
        const { data: currentAvatar, error: fetchError } = await supabase
          .from("public_avatars")
          .select("usage_count")
          .eq("id", avatarId)
          .single();

        if (!fetchError && currentAvatar) {
          await supabase
            .from("public_avatars")
            .update({ usage_count: (currentAvatar.usage_count || 0) + 1 })
            .eq("id", avatarId);
        }
      }

      if (userId) {
        await supabase.from("user_avatars").insert([
          {
            user_id: userId,
            public_avatar_id: avatarId,
          },
        ]);
      }

      return {
        success: true,
        avatarId: avatarId,
        message: "Avatar and scenes saved successfully",
      };
    } catch (error) {
      console.error("Error in saveAvatarWithScenes:", error);
      throw error;
    }
  }

  async saveAvatar(imageUrl) {
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }
  
    const storedUrl = imageUrl.includes('supabase.co/storage')
      ? imageUrl
      : await this.persistExternalImage(imageUrl, 'avatars');
  
    const { data, error } = await supabase
      .from('public_avatars')
      .insert([{ 
        image_url: storedUrl,
        original_prompt: null,
        variation_number: 1,
        appearance_description: 'Legacy Avatar'
      }])
      .select();

    if (error) {
      console.error("Error saving avatar to Supabase:", error);
      throw new Error("Failed to save avatar.");
    }

    return data[0];
  }

  async createAvatar(prompt) {
    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const variations = [
      `Create a realistic human avatar front facing to camera (Dont show the mobile): ${prompt}. Front-facing camera angle, natural selfie pose, realistic facial features, authentic lighting, high quality portrait. generate the output by editing the input image`,
      `Generate a realistic selfie-style avatar (Dont show the mobile): ${prompt}. Direct eye contact with camera, natural human appearance, front-facing angle, realistic skin texture and features. generate the output by editing the input image`,
      `Design a realistic human selfie avatar front facing to camera (Dont show the mobile): ${prompt}. Front camera perspective, genuine human expression, natural lighting, photorealistic quality, authentic portrait style. generate the output by editing the input image`,
      `Create a front-facing realistic avatar front facing to camera (Dont show the mobile): ${prompt}. Natural human features, direct camera gaze, realistic proportions, authentic selfie angle and lighting. generate the output by editing the input image`,
      `Generate a realistic human portrait selfie front facing to camera (Dont show the mobile): ${prompt}. Front-facing camera view, natural expression, photorealistic human features, genuine selfie composition. generate the output by editing the input image`,
      `Design a realistic selfie camera avatar front facing to camera (Dont show the mobile): ${prompt}. Human appearance, front-facing angle, natural pose, realistic facial details, authentic selfie lighting and perspective. generate the output by editing the input image`,
    ];

    const avatarImages = [];

    for (let i = 0; i < 6; i++) {
      try {
        console.log(`Generating avatar ${i + 1}/6...`);
        const output = await replicate.run("google/nano-banana", {
          input: {
            prompt: variations[i],
            image_input: [
              "https://enjaqtorkhhaopdzsdir.supabase.co/storage/v1/object/public/frames/Frame%201%20from%20Figma.png",
            ],
          },
        });

        const imageUrl = output;
        const storedUrl = await this.persistExternalImage(imageUrl, 'avatars');
        
        avatarImages.push({
          id: i + 1,
          name: `Avatar Variation ${i + 1}`,
          appearance: `Style ${i + 1}: ${variations[i].split(':')[1]?.split('.')[0]?.trim() || 'Modern avatar'}`,
          imageUrl: storedUrl,
          variation: i + 1
        });

        if (i < 5) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error generating avatar ${i + 1}:`, error);
        avatarImages.push({
          id: i + 1,
          name: `Avatar Variation ${i + 1}`,
          appearance: `Failed to generate variation ${i + 1}`,
          imageUrl: null,
          variation: i + 1,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      avatars: avatarImages,
      originalPrompt: prompt,
      totalGenerated: avatarImages.filter((avatar) => avatar.imageUrl).length,
      totalRequested: 6,
    };
  }

  async createScenes(avatarUrl, userId = null, io = null) {
    if (!avatarUrl) {
      throw new Error("Avatar URL is required");
    }

    const scenes = [
      {
        name: "Cozy Cafe",
        prompt:
          "Place this ultra-realistic human avatar in the horizontal center of a warm, cozy cafe setting, vertical portrait orientation. They should be sitting at a wooden table with a coffee cup, surrounded by soft lighting, books, and plants. The atmosphere should be relaxing and inviting with warm tones. Ultra-realistic human features, photorealistic quality.",
        id: 1,
      },
      {
        name: "Gym",
        prompt:
          "Show this ultra-realistic human avatar centered horizontally in a modern fitness gym, vertical portrait format. They should be in athletic wear, possibly near gym equipment like dumbbells or treadmills. The setting should be energetic with good lighting and a motivational atmosphere. Photorealistic human appearance.",
        id: 2,
      },
      {
        name: "Kitchen",
        prompt:
          "Place this ultra-realistic human avatar in the horizontal center of a beautiful, modern kitchen, vertical portrait orientation. They could be cooking or preparing food, with fresh ingredients visible. The kitchen should be well-lit with contemporary appliances and a clean, organized look. Ultra-realistic human features.",
        id: 3,
      },
      {
        name: "Swimming Pool",
        prompt:
          "Show this ultra-realistic human avatar centered horizontally by a luxurious swimming pool, vertical portrait format. They should be in appropriate swimwear, with crystal clear blue water, poolside furniture, and bright, sunny lighting. The atmosphere should be relaxing and resort-like. Photorealistic human quality.",
        id: 4,
      },
      {
        name: "Party",
        prompt:
          "Place this ultra-realistic human avatar in the horizontal center at a vibrant party or celebration, vertical portrait orientation. They should be dressed festively, surrounded by colorful decorations, lights, and a fun party atmosphere. The mood should be energetic and celebratory. Ultra-realistic human appearance.",
        id: 5,
      },
      {
        name: "Office Workspace",
        prompt:
          "Position this ultra-realistic human avatar horizontally centered in a modern office workspace, vertical portrait format. They should be at a desk with laptop, office supplies, and professional lighting. Clean, contemporary office environment. Photorealistic human features.",
        id: 6,
      },
      {
        name: "Beach Sunset",
        prompt:
          "Show this ultra-realistic human avatar centered horizontally on a beautiful beach at sunset, vertical portrait orientation. Golden hour lighting, ocean waves in background, relaxed beach attire. Warm, romantic atmosphere with ultra-realistic human appearance.",
        id: 7,
      },
      {
        name: "City Rooftop",
        prompt:
          "Place this ultra-realistic human avatar in the horizontal center on a stylish city rooftop, vertical portrait format. Urban skyline background, modern rooftop setting, evening lighting. Sophisticated urban vibe with photorealistic human quality.",
        id: 8,
      },
      {
        name: "Bookstore Library",
        prompt:
          "Position this ultra-realistic human avatar horizontally centered in a cozy bookstore or library, vertical portrait orientation. Surrounded by bookshelves, reading nook, warm ambient lighting. Intellectual, peaceful atmosphere with ultra-realistic human features.",
        id: 9,
      },
      {
        name: "Art Gallery",
        prompt:
          "Show this ultra-realistic human avatar centered horizontally in a contemporary art gallery, vertical portrait format. Modern artworks on walls, gallery lighting, sophisticated cultural setting. Elegant atmosphere with photorealistic human appearance.",
        id: 10,
      },
    ];

    const sceneImages = [];

    for (let i = 0; i < scenes.length; i++) {
      try {
        console.log(`Generating scene ${i + 1}/10: ${scenes[i].name}...`);

        const output = await replicate.run("google/nano-banana", {
          input: {
            prompt: scenes[i].prompt,
            image_input: [avatarUrl],
          },
        });

        const imageUrl = output;
        const storedUrl = await this.persistExternalImage(imageUrl, 'scenes');
        
        const sceneData = {
          id: scenes[i].id,
          name: scenes[i].name,
          description: scenes[i].prompt,
          imageUrl: storedUrl,
          originalAvatarUrl: avatarUrl
        };

        sceneImages.push(sceneData);

        if (userId && io && imageUrl) {
          this.triggerSceneAnimation(sceneData, userId, io).catch((error) => {
            console.error(
              `Failed to trigger animation for scene ${scenes[i].id}:`,
              error
            );
          });
        }

        if (i < scenes.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`Error generating scene ${scenes[i].name}:`, error);
        sceneImages.push({
          id: scenes[i].id,
          name: scenes[i].name,
          description: `Failed to generate ${scenes[i].name} scene`,
          imageUrl: null,
          originalAvatarUrl: avatarUrl,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      scenes: sceneImages,
      originalAvatarUrl: avatarUrl,
      totalGenerated: sceneImages.filter((scene) => scene.imageUrl).length,
      totalRequested: 10,
    };
  }

  async createCustomScenes(avatarUrl, customScenes, userId = null, io = null) {
    if (!avatarUrl) {
      throw new Error("Avatar URL is required");
    }

    if (
      !customScenes ||
      !Array.isArray(customScenes) ||
      customScenes.length === 0
    ) {
      throw new Error("Custom scenes array is required");
    }

    if (customScenes.length > 6) {
      throw new Error("Maximum 6 custom scenes allowed");
    }

    const sceneImages = [];

    for (let i = 0; i < customScenes.length; i++) {
      try {
        const scene = customScenes[i];
        console.log(
          `Generating custom scene ${i + 1}/${customScenes.length}: ${
            scene.name
          }...`
        );

        // Format the user's description into a proper prompt for nano-banana
        const formattedPrompt = `Place this ultra-realistic human avatar in the horizontal center of ${scene.description}, vertical portrait orientation. Ultra-realistic human features, photorealistic quality, natural lighting and atmosphere.`;

        const output = await replicate.run("google/nano-banana", {
          input: {
            prompt: formattedPrompt,
            image_input: [avatarUrl],
          },
        });

        const imageUrl = output;
        const storedUrl = await this.persistExternalImage(imageUrl, 'scenes');
        
        const sceneData = {
          id: scene.id || (i + 1),
          name: scene.name,
          description: scene.description,
          imageUrl: storedUrl,
          originalAvatarUrl: avatarUrl,
          isCustom: true
        };

        sceneImages.push(sceneData);

        // Trigger animation if user is authenticated and socket is available
        if (userId && io && imageUrl) {
          this.triggerSceneAnimation(sceneData, userId, io).catch((error) => {
            console.error(
              `Failed to trigger animation for custom scene ${scene.id}:`,
              error
            );
          });
        }

        // Add delay between generations to avoid rate limits
        if (i < customScenes.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(
          `Error generating custom scene ${customScenes[i].name}:`,
          error
        );
        sceneImages.push({
          id: customScenes[i].id || i + 1,
          name: customScenes[i].name,
          description: `Failed to generate ${customScenes[i].name} scene`,
          imageUrl: null,
          originalAvatarUrl: avatarUrl,
          isCustom: true,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      scenes: sceneImages,
      originalAvatarUrl: avatarUrl,
      totalGenerated: sceneImages.filter((scene) => scene.imageUrl).length,
      totalRequested: customScenes.length,
      isCustom: true,
    };
  }

  async triggerSceneAnimation(sceneData, userId, io) {
    try {
      await animationService.animateScene(sceneData, userId, io);
    } catch (error) {
      console.error(
        `Error triggering animation for scene ${sceneData.id}:`,
        error
      );
      throw error;
    }
  }

  async testReplicate() {
    const output = await replicate.run("google/gemini-2.5-flash-image", {
      input: {
        prompt: "A simple test image of a smiling person",
        output_format: "jpg",
      },
    });

    const imageUrl = output;

    return {
      success: true,
      message: "Replicate connection successful",
      response: "Image generated successfully",
      imageUrl: imageUrl,
    };
  }

  async testNanoBanana() {
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: "A simple test with nano-banana model",
      },
    });

    const imageUrl = output;

    return {
      success: true,
      message: "Nano-Banana connection successful",
      response: "Test completed successfully",
      imageUrl: imageUrl,
    };
  }
}

module.exports = new AvatarService();
