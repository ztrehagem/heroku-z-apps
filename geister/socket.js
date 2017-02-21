const Rooms = require('./rooms');
const Serializer = require('serializer');

module.exports = function(io) {  
  io.on('connection', (socket)=> {

    var joinedRoom = null;
    var userId = socket.id;

    socket.on('room:index', function(data, cb) {
      cb(Rooms.getRooms().map(Serializer.geisterRooms));
    });

    socket.on('room:create', function(roomName, cb) {
      var room = Rooms.createRoom(roomName);
      if (!room.join(userId)) cb(null);

      socket.join(room.id, function() {
        joinedRoom = room;
        cb(Serializer.geisterRooms(room));
      });
    });

    socket.on('room:join', function(roomId, cb) {
      var room = Rooms.getRoom(roomId);
      if (!room || !room.join(userId)) cb(null);

      socket.join(room.id, function() {
        joinedRoom = room;
        var serializedRoom = Serializer.geisterRooms(room);
        cb(serializedRoom);
        socket.to(joinedRoom.id).emit('user:joined', serializedRoom);
      });
    });

    socket.on('user:message', function(message, cb) {
      if (!joinedRoom) {
        return cb(false);
      }
      socket.to(joinedRoom.id).emit('user:message', message);
      cb(true);
    });

    socket.on('user:play', function(details, cb) {
      if (!joinedRoom || !joinedRoom.canPlay()) {
        return cb(false);
      }

      var result = joinedRoom.play(userId);
      if (result) {
        socket.to(joinedRoom.id).emit('user:play', result);
      }
      cb(result);
    });

  });
};
