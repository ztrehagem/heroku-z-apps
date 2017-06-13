app.component('room', {
  templateUrl: asset.template('room'),
  controller($state, $q, Socket, apiMe) {
    'ngInject';

    this.$onInit = ()=> {
      this.socket = new Socket();

      this.userType = null;
      this.players = false;
      this.won = null;

      this.initialized = apiMe.get().then(me => this.socket.emitAsync('join', {
        token: $state.params.token,
        id: me.id // TODO これバラしちゃいかんやつ
      })).then(([{userType, room}, cbAsync]) => {
        console.log('joined socket room', userType, room);
        this.userType = userType;
        this.players = room.players;
        this.won = room.won;
        this.showField = ['playing', 'finished'].some(s => s == room.status);
      }).catch(()=> $state.go('root'));

      this.ready = (formation)=> {
        return this.socket.emitAsync('ready', formation).then(()=> {
          this.players[this.userType].ready = true;
        });
      };

      this.socket.on('joined:guest', (room)=> {
        console.log('joined:guest');
        this.players = room.players;
      });

      this.socket.on('ready', ({userType})=> {
        console.log('ready!', userType);
        this.players[userType].ready = true;
      });

      this.socket.on('started', ({firstUser})=> {
        console.log('started!');
        this.showField = true;
        this.firstUser = firstUser;
      });
    };
  }
});
