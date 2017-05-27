app.controller('room', function($state, socket, apiMe) {
  'ngInject';

  apiMe.get().then(resp => socket.emit('join', {
    token: $state.params.token,
    id: resp.id
  }, ok => {
    if (!ok) {
      return $state.go('root');
    }
    console.log('succeeded joining socket room');
  }));

  socket.on('joined:guest', (id)=> {
    console.log('joined:guest', id);
  });

  socket.on('started', (o)=> {
    console.log('started!', o);
  });

  this.ready = ()=> {
    socket.emit('ready');
  };
});
