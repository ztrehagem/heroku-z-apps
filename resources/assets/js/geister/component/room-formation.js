app.component('roomFormation', {
  templateUrl: asset.template('room-formation'),
  require: {
    roomCtrl: '^room'
  },
  controller() {
    'ngInject';

    this.$onInit = ()=> {
      this.isDecided = false;
      this.formation = [true,true,true,true,false,false,false,false];
    };

    this.decide = ()=> {
      this.sending = true;
      this.roomCtrl.socket.emit('ready', this.formation, (data)=> {
        console.log('ready, received', data);
        if (!data) {
          this.sending = false;
          console.log('invalid formation');
        }
      });
    };
  }
});
