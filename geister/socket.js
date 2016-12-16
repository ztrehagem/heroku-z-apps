const rooms = require('./rooms');

module.exports = function(io) {
  io.on('connection', (socket)=> {

    var joinedRoomId = null;

    socket.on('joinRoom', function(roomId, cb) {
      socket.join(roomId, function() {
        joinedRoomId = roomId;
        cb(true);
      });
    });

    socket.on('user:message', function(message, cb) {
      if (joinedRoomId) {
        socket.to(joinedRoomId).emit('user:message', message);
        cb(true);
      } else {
        cb(false);
      }
    });

  });
};
