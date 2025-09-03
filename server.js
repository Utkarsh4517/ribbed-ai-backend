const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./src/config');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const { initializeRedis } = require('./src/config/redis');
const { initializeSocketHandlers } = require('./src/services/socketService');

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
    await initializeRedis();
    initializeSocketHandlers(io);
    
    server.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
      console.log(`Health check: http://localhost:${config.PORT}/api/health`);
      console.log(`WebSocket server ready`);
      console.log(`Redis connected`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();