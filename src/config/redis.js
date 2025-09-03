const { createClient } = require('redis');
const config = require('./index');

let redisClient = null;

async function initializeRedis() {
  try {
    redisClient = createClient({
      url: config.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('Redis ping successful');
    
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

function getRedisClient() {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client not initialized or disconnected');
  }
  return redisClient;
}

async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedis
};