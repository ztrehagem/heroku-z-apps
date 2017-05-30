app.component('room', {
  templateUrl: asset.template('room'),
  controller($state, Socket, apiMe) {
    'ngInject';

    this.socket = new Socket();

    this.userType = null;
    this.players = false;

    this.initialized = apiMe.get().then(resp => this.socket.emit('join', {
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

    this.socket.on('joined:guest', (room)=> {
      console.log('joined:guest');
      this.players = room.players;
    });

    this.socket.on('ready', ({userType})=> {
      this.players[userType].ready = true;
    });

    this.socket.on('started', (o)=> {
      console.log('started!', o);
      this.socket.emit('get-field', null, (field)=> console.log('field', field));
    });
  }
});
