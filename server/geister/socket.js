const Room = require('./room');

module.exports = io => io.on('connection', socket => {

  let userId, userType, roomToken;

  socket.on('join', ({id, token}, cb)=> {
    userId = id;

    const room = new Room(token);

    room.connect(userId).then((_userType)=> {
      socket.join(room.token, ()=> {
        roomToken = room.token;
        userType = _userType;
        socket.to(room.token).emit('joined', room.serializeSummary());
        cb({userType, room: room.serializeSummary()});
      });
    }).catch(err => {
      console.log('failed on socket join', err);
      cb(null);
    });
  });

  socket.on('ready', (formation, cb)=> {
    if (!userType) return cb(false);

    const room = new Room(roomToken);

    room.ready(userType, formation).then(isStarted => {
      socket.to(room.token).emit('ready', {userType, isStarted});
      cb({isStarted});
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

  socket.on('action', ({from, dest}, cb)=> {
    if (!userType) return cb(false);

    const room = new Room(roomToken);

    room.action(userType, from, dest).then(result => {
      cb({
        result: result[userType],
        info: room.serializePlayingInfo(userType)
      });
      if (room.won) {
        room.applyWon();
      }
      const inverseUesrType = Room.inverseUserType(userType);
      socket.to(room.token).emit('rival-acted', {
        result: result[inverseUesrType],
        info: room.serializePlayingInfo(inverseUesrType)
      });
    }).catch(err => {
      console.log('failed on socket move', err);
      cb(null);
    });
  });

  socket.on('disconnect', ()=> {
    console.log('disconnect', userId);

    if (roomToken) {
      const room = new Room(roomToken);
      console.log('leaving', userType, roomToken);
      room.leave(userType).then(()=> {
        socket.to(room.token).emit('leaved', userType);
        roomToken = null;
        console.log('leaved');
      }).catch(()=> {
        console.log('failed on room.leave');
      });
    }
  });
});
