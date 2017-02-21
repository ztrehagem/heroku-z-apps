modules.app

.controller('rootCtrl', function($scope, socket) {
  'ngInject';

  var ctrl = this;
  ctrl.rooms = [];
  ctrl.joinedRoomId = null;
  ctrl.messages = [];

  ctrl.reloadRooms = function() {
    socket.emit('room:index', null, function(rooms) {
      ctrl.rooms = rooms;
    });
  };

  ctrl.createRoom = function() {
    socket.emit('room:create', ctrl.newRoomName, function(room) {
      if (!room) return;
      console.log('room created', room);
      ctrl.joinedRoomId = room.id;
      ctrl.newRoomName = null;
      clearMessages();
    });
  };

  ctrl.joinRoom = function(roomId) {
    socket.emit('room:join', roomId, function(room) {
      if (room) ctrl.joinedRoomId = room.id;
      console.log('joined room', room);
      clearMessages();
    });
  };

  ctrl.message = function() {
    var message = ctrl.inputMessage;
    socket.emit('user:message', message, function(isOk) {
      if (isOk) addMessage(message);
    });
    ctrl.inputMessage = null;
  };

  ctrl.play = function(details) {
    socket.emit('user:play', {detail: 'hoge'}, function(accepted) {
      console.log('mine:', accepted);
    });
  };

  socket.on('user:message', function(message) {
    addMessage(message);
  });

  socket.on('user:play', function(details) {
    console.log('other:', details);
  });

  socket.on('user:joined', function(room) {
    console.log('user:joined', room);
  });

  function clearMessages() {
    ctrl.messages = [];
  }
  function addMessage(message) {
    ctrl.messages.unshift(message);
  }

  // -- initialize
  ctrl.reloadRooms();
});
