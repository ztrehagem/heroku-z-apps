app.component('roomPlayfield', {
  templateUrl: asset.template('room-playfield'),
  require: {
    roomCtrl: '^room'
  },
  controller() {
    'ngInject';

    this.$onInit = ()=> {
      this.field = null;

      this.roomCtrl.socket.emit('get-field', null, field => {
        this.field = this.roomCtrl.userType == 'host' ? field : field.reverse();
      });
    };
  }
});
