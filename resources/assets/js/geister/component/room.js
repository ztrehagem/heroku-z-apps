app.component('room', {
  templateUrl: asset.template('room'),
  controller($state, $q, Socket, apiMe) {
    'ngInject';

    this.socket = new Socket();

    this.userType = null;
    this.players = false;

    this.initialized = apiMe.get().then(resp => this.socket.emitAsync('join', {
      token: $state.params.token,
      id: resp.id
    })).then(([resp, cbAsync]) => {
      return resp || $q.reject();
    }).then(resp => {
      console.log('succeeded joining socket room', resp);
      this.userType = resp.userType;
      this.players = resp.room.players;
    }).catch(()=> $state.go('root'));

    this.socket.on('joined:guest', (room)=> {
      console.log('joined:guest');
      this.players = room.players;
    });

    this.socket.on('ready', ({userType})=> {
      console.log('ready!', userType);
      this.players[userType].ready = true;
    });

    this.socket.on('started', (o)=> {
      console.log('started!', o);
      this.socket.emit('get-field', null, (field)=> console.log('field', field));
    });
  }
});
