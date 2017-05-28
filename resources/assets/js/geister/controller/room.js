app.controller('room', function($state, socket, apiMe) {
  'ngInject';

  this.userType = null;
  this.players = {};

  apiMe.get().then(resp => socket.emit('join', {
    token: $state.params.token,
    id: resp.id
  }, resp => {
    if (!resp) {
      return $state.go('root');
    }
    console.log('succeeded joining socket room', resp);
    this.userType = resp.userType;
    this.players = resp.room.players;
  }));

  socket.on('joined:guest', (room)=> {
    console.log('joined:guest');
    this.players = room.players;
  });

  socket.on('ready', ({userType})=> {
    this.players[userType].ready = true;
  });

  socket.on('started', (o)=> {
    console.log('started!', o);
  });

  this.doReady = ()=> {
    socket.emit('ready');
  };

  this.canReady = ()=> {
    return this.players.host && this.players.guest && !this.players[this.userType].ready;
  };
});
