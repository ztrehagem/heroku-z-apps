const Room = require('./room');

module.exports = io => io.on('connection', socket => {

  let userId, userType, room;

  socket.on('join', ({id, token}, cb)=> {
    userId = id;

    new Room(token).fetchSummary().then(tmpRoom => {
      if (!tmpRoom.isPlayer(userId)) return cb(false);

      room = tmpRoom;

      socket.join(room.token, ()=> {
        if (room.isHost(userId)) {
          userType = Room.UserType.HOST;
        } else if (room.isGuest(userId)) {
          userType = Room.UserType.GUEST;
          socket.to(room.token).emit('joined:guest', room.serializeSummary());
        }
        cb({userType, room: room.serializeSummary()});
      });
    });
  });

  socket.on('ready', (formation, cb)=> {
    room.fetchSummary()
      .then(()=> room.ready(userType, formation))
      .then(()=> io.to(room.token).emit('ready', {userType}))
      .then(()=> cb(true))
      .then(()=> room.fetchSummary())
      .then(()=> room.isPlayable ? room.play().then(()=> io.to(room.token).emit('started')) : null)
      .catch(()=> {
        console.log('error on ready');
        cb(false);
      });
  });

  socket.on('get-field', (data, cb)=> {
    if (!userType) return cb(false);
    room.fetchField()
      .then(()=> cb(room.serializeField(userType)))
      .catch(()=> {
        console.log('error on get-field');
        cb(false);
      });
  });

});
