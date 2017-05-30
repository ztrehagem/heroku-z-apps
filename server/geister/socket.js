const Room = require('./room');

// TODO move to room.js
const UserType = {HOST: 'host', GUEST: 'guest'};

module.exports = io => io.on('connection', socket => {

  let token = null;
  let userId = null;
  let userType = null;
  let room = null;

  socket.on('join', (data, cb)=> {
    // redisの参加者情報を確認する
    userId = data.id;
    Room.getSummary(data.token).then(_room => {
      if (!_room.isPlayer(userId)) return cb(false);
      token = data.token;
      room = _room;
      socket.join(token, ()=> {
        if (room.isHost(userId)) {
          userType = UserType.HOST;
        } else if (room.isGuest(userId)) {
          userType = UserType.GUEST;
          socket.to(token).emit('joined:guest', room.serializeSummary());
        }
        cb({userType, room: room.serializeSummary()});
      });
    });
  });

  socket.on('ready', (formation)=> {
    room.updateSummary()
      .then(()=> room.ready(userType, formation))
      .then(()=> io.to(token).emit('ready', {userType}))
      .then(()=> room.updateSummary())
      .then(()=> !room.isPlayable ? null : room.play()
        .then(()=> io.to(token).emit('started'))
        .catch(()=> console.log('failed on play'))
      )
      .catch(()=> console.log('failed on ready', userType));
  });

  socket.on('get-field', (data, cb)=> {
    if (!userType) return cb(false);
    room.updateField()
      .then(()=> cb(room.serializeField(userType)));
  });

});
