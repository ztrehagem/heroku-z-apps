app.factory('Socket', function($rootScope, $q) {
  'ngInject';

  const cbFn = (deferred)=> (data, cb)=> {
    deferred[data ? 'resolve' : 'reject']([data, makeAsyncCb(cb)]);
  };

  const defer = (fn)=> {
    const deferred = $q.defer();
    fn(deferred);
    return deferred.promise;
  };

  const makeAsyncCb = (cb)=> (data)=> {
    return defer(deferred => cb(data, cbFn(deferred)));
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
      return defer(deferred => this.socket.emit(name, arg, cbFn(deferred)));
    }
    close() {
      this.socket.disconnect();
    }
  };
});
