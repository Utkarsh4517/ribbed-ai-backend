function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('authenticate', (data) => {
      try {
        const { userId } = data;
        if (userId) {
          socket.join(`user:${userId}`);
          socket.userId = userId;
          console.log(`User ${userId} authenticated and joined room`);
          
          socket.emit('authenticated', { success: true });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authenticated', { success: false, error: error.message });
      }
    });

    socket.on('requestAnimationStatus', async (data) => {
      try {
        const { animationId } = data;
        const animationService = require('./animationService');
        const status = await animationService.getAnimationStatus(animationId);
        
        socket.emit('animationStatusUpdate', {
          animationId,
          sceneId: status.sceneId,
          status: status.status,
          animatedVideoUrl: status.animatedVideoUrl,
          error: status.error
        });
      } catch (error) {
        console.error('Error fetching animation status:', error);
        socket.emit('animationStatusUpdate', {
          animationId: data.animationId,
          status: 'error',
          error: error.message
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = {
  initializeSocketHandlers
};