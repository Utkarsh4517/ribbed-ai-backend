#Express JS backend service for generating TikTok-style UGC videos with custom voices and reusable scenes.

### Models Used:
- google/nano-banana hosted on replicate : for avatar generation : Best in quality, better than flux
- google/nano-banana hosted on replicate : for scenes generation of an avatar : Best in quality, better than flux
- elevenlabs/tts/eleven-v3 : hosted on fal.ai : for realistic voice generation using tts.
- wan-video/wan-2.2-i2v-fast : hosted on replicate for quickly making avatars feel alive : cheap and fast.
- bytedance/omnihuman : hosted on fal.ai for making a video from scene + audio : cheap (we can replace it with fal-ai/ai-avatar to improve the video quality but it is significantly expensive compared to omnihuman).

### Backend

A robust Express.js API server that powers the Ribbed AI mobile app with real-time video generation capabilities.

**🚀 Quick Start**
```bash
npm install
npm run dev
```

**📦 Core Features**
- **Avatar Generation** - Create custom AI avatars from text descriptions
- **Text-to-Speech** - Convert scripts to realistic voice audio
- **Video Animation** - Bring avatars to life with lip-sync and animations  
- **Real-time Updates** - WebSocket support for live generation status
- **Authentication** - Secure user management and session handling

**🏗️ Architecture**
- **Controllers** - Handle HTTP requests and responses
- **Services** - Business logic for AI model integrations
- **Middleware** - Authentication, validation, and error handling
- **Routes** - Clean API endpoint organization
- **Config** - Database, Redis, and external service setup

**🔧 Environment Setup**
Create a `.env` based on `.env.example` file with your API keys for Replicate, Fal.ai, Supabase, and Redis.

