var socket = null;

modules.app

.run(function() {
  console.log('geister');

  socket = io('/geister');

  socket.on('greeting', function(data) {
    console.log('greeting from server:', data);
  });
})

.controller('rootCtrl', function($scope) {
  'ngInject';

  var ctrl = this;

  ctrl.createRoom = function() {
    socket.emit('createRoom', null, function(roomId) {
      console.log('room:', roomId);
      $scope.$apply(function() {
        ctrl.roomId = roomId;
      });
    });
  };

  ctrl.getRoom = function() {
    socket.emit('getRoom', ctrl.roomId, function(roomId) {
      console.log('room:', roomId);
      $scope.$apply(function() {
        ctrl.roomId = roomId;
      });
    });
  };
});
