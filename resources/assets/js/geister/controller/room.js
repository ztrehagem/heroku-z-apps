app.controller('room', function($state, socket, apiMe) {
  'ngInject';

  apiMe.get().then(resp => socket.emit('join', {
    token: $state.params.token,
    id: resp.id
  }, ok => {
    if (!ok) {
      $state.go('root');
    }
    console.log('succeeded joining socket room');
  }));

});
