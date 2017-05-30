app.factory('Socket', function($rootScope) {
  'ngInject';

  return class Socket {
    constructor() {
      this.socket = io('/geister');
    }
    on(name, fn) {
      this.socket.on(name, fn && ((...args)=> {
        $rootScope.$apply(()=> fn(...args));
      }));
    }
    emit(name, arg, fn) {
      this.socket.emit(name, arg, fn && ((...args)=> {
        $rootScope.$apply(()=> fn(...args));
      }));
    }
  };
});
