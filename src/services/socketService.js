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

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = {
  initializeSocketHandlers
};