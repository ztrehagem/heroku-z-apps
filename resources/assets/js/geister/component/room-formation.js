app.component('roomFormation', {
  templateUrl: asset.template('room-formation'),
  require: {
    roomCtrl: '^room'
  },
  bindings: {
    formation: '='
  },
  controller($scope) {
    'ngInject';
  }
});
