const Room = require('./room');

module.exports = io => io.on('connection', socket => {

  let userId, userType, roomToken;

  socket.on('join', ({id, token}, cb)=> {
    userId = id;

    const room = new Room(token);

    room.fetch([Room.KeyType.SUMMARY]).then(()=> {
      if (!room.isPlayer(userId)) return Promise.reject();

      socket.join(room.token, ()=> {
        roomToken = token;

        if (room.isHost(userId)) {
          userType = Room.UserType.HOST;
        } else if (room.isGuest(userId)) {
          userType = Room.UserType.GUEST;
          socket.to(room.token).emit('joined:guest', room.serializeSummary());
        }
        cb({userType, room: room.serializeSummary()});
      });
    }).catch(err => {
      console.log('faield on socket join', err);
      cb(null);
    });
  });

  socket.on('ready', (formation, cb)=> {
    const room = new Room(roomToken);
    room.ready(userType, formation).then(()=> {
      io.to(room.token).emit('ready', {userType});
      cb(true);
    }).then(()=> {
      room.play()
        .then(()=> io.to(room.token).emit('started'))
        .catch(()=> null);
    }).catch(err => {
      console.log('faield on socket ready', err);
      cb(null);
    });
  });

  socket.on('get-playing-info', (data, cb)=> {
    if (!userType) return cb(false);

    const room = new Room(roomToken);

    room.fetch([Room.KeyType.SUMMARY, Room.KeyType.FIELD]).then(()=> {
      cb(room.serializePlayingInfo(userType));
    }).catch(err => {
      console.log('failed on socket get-playing-info', err);
      cb(null);
    });
  });
});
