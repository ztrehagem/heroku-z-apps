const rooms = require('./rooms');

module.exports = function(io) {
  io.on('connection', (socket)=> {
    console.log('connection of geister');
    socket.emit('greeting', {message: 'this is geister namespace'});

    socket.on('createRoom', function(_, cb) {
      console.log('on createRoom', _);
      var room = rooms.createRoom();
      cb(room && room.id);
    });

    socket.on('getRoom', function(roomId, cb) {
      console.log('on getRoom', roomId);
      var room = rooms.getRoom(roomId);
      cb(room && room.id);
    });
  });
};
