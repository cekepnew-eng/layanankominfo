let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: { origin: '*' }
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      console.warn("Socket.io not initialized!");
    }
    return io;
  }
};
