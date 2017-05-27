app.service('socket', function($rootScope) {
  'ngInject';

  var socket = io('/geister');

  this.on = (name, fn)=> {
    socket.on(name, fn && ((...args)=> {
      $rootScope.$apply(()=> fn(...args));
    }));
  };

  this.emit = (name, arg, fn)=> {
    socket.emit(name, arg, fn && ((...args)=> {
      $rootScope.$apply(()=> fn(...args));
    }));
  };
});
