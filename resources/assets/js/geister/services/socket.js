modules.services

.service('socket', function($rootScope) {
  'ngInject';

  var socket = io('/geister');

  this.on = function(name, fn) {
    socket.on(name, function(resp) {
      $rootScope.$apply(function() {
        fn(resp);
      });
    });
  };

  this.emit = function(name, arg, fn) {
    socket.emit(name, arg, function(resp) {
      $rootScope.$apply(function() {
        fn(resp);
      });
    });
  };
});
