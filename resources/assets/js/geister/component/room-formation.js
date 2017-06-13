app.component('roomFormation', {
  templateUrl: asset.template('room-formation'),
  require: {
    roomCtrl: '^room'
  },
  controller() {
    'ngInject';

    this.$onInit = ()=> {
      this.formation = [true,true,true,true,false,false,false,false];
    };

    this.isValidFormation = ()=> {
      return this.formation.reduce((count, cell)=> count += cell) == 4;
    };

    this.decide = ()=> {
      this.sending = true;
      this.roomCtrl.ready(this.formation).catch(()=> {
        this.sending = false;
        console.log('invalid formation');
      });
    };
  }
});
