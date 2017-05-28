const Room = require('./room');

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

  socket.on('ready', (data)=> {
    room.ready(userType).then(()=> {
      io.to(token).emit('ready', {userType});
      return room.updateSummary();
    }).then(()=> {
      if (room.isStarted) {
        io.to(token).emit('started');
      }
    }).catch(()=> console.log('failed ready', userType));
  });

});
