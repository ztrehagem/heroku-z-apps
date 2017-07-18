app.filter('qstate', function() {
  'ngInject';

  return (promise, type)=> {
    switch (type) {
      case 'succeeded': return angular.isDefined(promise) && promise.$$state.status === 1;
      case 'pending': return angular.isDefined(promise) && promise.$$state.status === 0;
    }
  };
});
