const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Replicate = require('replicate');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Account created successfully',
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      message: error.message 
    });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Signed in successfully',
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      error: 'Failed to sign in',
      message: error.message 
    });
  }
});

app.post('/api/auth/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ 
      error: 'Failed to sign out',
      message: error.message 
    });
  }
});

app.post('/api/create-avatar', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
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

    res.json({
      success: true,
      avatar: avatarData,
      originalPrompt: prompt,
      imageUrl: imageUrl
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
    sdk: 'replicate with google/gemini-2.5-flash-image'
  });
});

app.get('/api/test-replicate', async (req, res) => {
  try {
    const output = await replicate.run("google/gemini-2.5-flash-image", {
      input: {
        prompt: 'A simple test image of a smiling person',
        output_format: "jpg"
      }
    });

    const imageUrl = output;

    res.json({
      success: true,
      message: 'Replicate connection successful',
      response: 'Image generated successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Replicate connection failed',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test Replicate: http://localhost:${PORT}/api/test-replicate`);
});