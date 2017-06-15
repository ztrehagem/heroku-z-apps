app.filter('qstate', function() {
  'ngInject';

  return (promise, type)=> {
    switch (type) {
      case 'succeeded': return promise.$$state.status == 1;
      case 'not-failed': return angular.isUndefined(promise) || promise.$$state.status == 1;
    }
  };
});
