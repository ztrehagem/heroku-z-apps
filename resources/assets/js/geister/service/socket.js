app.factory('Socket', function($rootScope, $q) {
  'ngInject';

  const makeAsyncCb = (cb)=> (data)=> {
    const deferred = $q.defer();
    cb(data, (data, cb)=> deferred.resolve([data, makeAsyncCb(cb)]));
    return deferred.promise;
  };

  return class Socket {
    constructor() {
      this.socket = io('/geister');
    }
    on(name, fn) {
      this.socket.on(name, fn && ((...args)=> {
        $rootScope.$apply(()=> fn(...args));
      }));
    }
    onAsync(name, fn) {
      this.socket.on(name, (data, cb)=> {
        fn($q.resolve([data, makeAsyncCb(cb)]));
      });
    }
    emit(name, arg, fn) {
      this.socket.emit(name, arg, fn && ((...args)=> {
        $rootScope.$apply(()=> fn(...args));
      }));
    }
    emitAsync(name, arg) {
      const deferred = $q.defer();
      this.socket.emit(name, arg, (data, cb)=> {
        deferred.resolve([data, makeAsyncCb(cb)]);
      });
      return deferred.promise;
    }
  };
});
