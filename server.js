const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
app.post('/api/create-avatar', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const enhancedPrompt = `Create a detailed avatar description based on this request: "${prompt}". 
    Include physical appearance, clothing style, personality traits, and any unique characteristics. 
    Format the response as a JSON object with the following structure:
    {
      "name": "Avatar name",
      "appearance": "Physical description",
      "clothing": "Clothing style", 
      "personality": "Personality traits",
      "uniqueFeatures": "Special characteristics"
    }

    Make sure to return only valid JSON without any markdown formatting or additional text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: enhancedPrompt,
    });

    const text = response.text;

    let avatarData;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        avatarData = JSON.parse(jsonMatch[0]);
      } else {
        avatarData = {
          name: "Generated Avatar",
          appearance: text.substring(0, 200) + "...",
          clothing: "Modern casual wear",
          personality: "Friendly and engaging",
          uniqueFeatures: "AI-generated character"
        };
      }
    } catch (parseError) {
      console.warn('JSON parsing failed, using fallback:', parseError.message);
      avatarData = {
        name: "Generated Avatar",
        description: text,
        appearance: "Custom avatar based on your request",
        clothing: "Stylish and modern",
        personality: "Unique and engaging",
        uniqueFeatures: "Personalized AI character"
      };
    }

    const finalAvatarData = {
      name: avatarData.name || "Generated Avatar",
      appearance: avatarData.appearance || "Custom avatar appearance",
      clothing: avatarData.clothing || "Stylish outfit",
      personality: avatarData.personality || "Engaging personality",
      uniqueFeatures: avatarData.uniqueFeatures || "Unique characteristics"
    };

    res.json({
      success: true,
      avatar: finalAvatarData,
      originalPrompt: prompt,
      rawResponse: text 
    });

  } catch (error) {
    console.error('Error creating avatar:', error);
    res.status(500).json({ 
      error: 'Failed to create avatar',
      message: error.message,
      details: error.toString()
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Ribbed AI Backend is running',
    timestamp: new Date().toISOString(),
    sdk: '@google/genai v1.16.0'
  });
});

app.get('/api/test-gemini', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: 'Hello, please respond with "Gemini is working correctly!"',
    });

    res.json({
      success: true,
      message: 'Gemini connection successful',
      response: response.text
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Gemini connection failed',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test Gemini: http://localhost:${PORT}/api/test-gemini`);
});