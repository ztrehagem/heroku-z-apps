const Room = require('./room');

module.exports = io => io.on('connection', socket => {

  let token, userId, userType, room;

  socket.on('join', (data, cb)=> {
    userId = data.id;
    Room.getSummary(data.token).then(_room => {
      if (!_room.isPlayer(userId)) return cb(false);
      token = data.token;
      room = _room;
      socket.join(token, ()=> {
        if (room.isHost(userId)) {
          userType = Room.UserType.HOST;
        } else if (room.isGuest(userId)) {
          userType = Room.UserType.GUEST;
          socket.to(token).emit('joined:guest', room.serializeSummary());
        }
        cb({userType, room: room.serializeSummary()});
      });
    });
  });

  socket.on('ready', (formation, cb)=> {
    room.updateSummary()
      .then(()=> room.ready(userType, formation))
      .then(()=> io.to(token).emit('ready', {userType}))
      .then(()=> cb(true))
      .then(()=> room.updateSummary())
      .then(()=> room.isPlayable ? room.play().then(()=> io.to(token).emit('started')) : null)
      .catch(()=> cb(false));
  });

  socket.on('get-field', (data, cb)=> {
    if (!userType) return cb(false);
    room.updateField()
      .then(()=> cb(room.serializeField(userType)))
      .catch(()=> cb(false));
  });

});
