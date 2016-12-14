var socket = null;

modules.app

.run(function() {
  console.log('geister');

  socket = io('/geister');

  socket.on('greeting', function(data) {
    console.log('greeting from server:', data);
  });
})

.controller('rootCtrl', function($scope, apiRooms) {
  'ngInject';

  var ctrl = this;
  ctrl.rooms = [];
  ctrl.joinedRoomId = null;

  ctrl.reloadRooms = function() {
    apiRooms.getRooms().then(function(rooms) {
      console.log(rooms);
      ctrl.rooms = rooms;
    }).catch(function() {
      ctrl.rooms = [];
    });
  };

  ctrl.createRoom = function() {
    apiRooms.createRoom().then(function(room) {
      ctrl.joinedRoomId = room.id;
    });
  };

  ctrl.joinRoom = function(roomId) {
    apiRooms.joinRoom(roomId).then(function() {
      ctrl.joinedRoomId = roomId;
    });
  };

  // -- initialize
  ctrl.reloadRooms();
});
