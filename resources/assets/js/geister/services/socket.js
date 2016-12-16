modules.services

.service('socket', function($rootScope) {
  'ngInject';

  var socket = io('/geister');

  this.on = function(name, fn) {
    socket.on(name, function() {
      var args = arguments;
      $rootScope.$apply(function() {
        if (angular.isFunction(fn)) fn.apply(socket, args);
      });
    });
  };

  this.emit = function(name, arg, fn) {
    socket.emit(name, arg, function() {
      var args = arguments;
      $rootScope.$apply(function() {
        if (angular.isFunction(fn)) fn.apply(socket, args);
      });
    });
  };
});
