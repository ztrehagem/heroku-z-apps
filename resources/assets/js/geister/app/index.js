var socket = null;

modules.app

.controller('rootCtrl', function($scope, apiRooms, socket) {
  'ngInject';

  var ctrl = this;
  ctrl.rooms = [];
  ctrl.joinedRoomId = null;
  ctrl.messages = [];

  ctrl.reloadRooms = function() {
    apiRooms.getRooms().then(function(rooms) {
      ctrl.rooms = rooms;
    });
  };

  ctrl.createRoom = function() {
    apiRooms.createRoom().then(function(room) {
      socket.emit('joinRoom', room.id, function(isOk) {
        if (isOk) ctrl.joinedRoomId = room.id;
        ctrl.messages = [];
      });
    });
  };

  ctrl.joinRoom = function(roomId) {
    apiRooms.joinRoom(roomId).then(function() {
      socket.emit('joinRoom', roomId, function(isOk) {
        if (isOk) ctrl.joinedRoomId = roomId;
        ctrl.messages = [];
      });
    });
  };

  ctrl.message = function() {
    var message = ctrl.inputMessage;
    console.log('sending message:', message);
    socket.emit('user:message', message, function(isOk) {
      if (isOk) {
        ctrl.messages.unshift(message);
        ctrl.inputMessage = null;
      }
    });
    ctrl.inputMessage = null;
  };

  socket.on('user:message', function(message) {
    console.log('recieve message:', message);
    ctrl.messages.unshift(message);
  });

  // -- initialize
  ctrl.reloadRooms();
});
