const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./src/config');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const { initializeRedis, closeRedis } = require('./src/config/redis');
const { initializeSocketHandlers } = require('./src/services/socketService');
const videoService = require('./src/services/videoService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.set('io', io);
app.use('/api', routes);
app.use(errorHandler);

async function startServer() {
  try {
    console.log('Initializing Redis...');
    await initializeRedis();
    console.log('Redis initialized successfully');
    
    console.log('Initializing Socket handlers...');
    initializeSocketHandlers(io);
    
    console.log('Starting video queue processor...');
    videoService.startQueueProcessor(io);
    
    server.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
      console.log(`Health check: http://localhost:${config.PORT}/api/health`);
      console.log(`WebSocket server ready`);
      console.log(`Video queue processor started`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await closeRedis();
    console.log('Redis connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    await closeRedis();
    console.log('Redis connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();