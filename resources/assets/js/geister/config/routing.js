app.config(function($urlRouterProvider) {
  'ngInject';

  $urlRouterProvider.when('', '/');
});

app.config(function($stateProvider) {
  'ngInject';

  $stateProvider
  .state('root', {
    url: '/',
    controller: 'root as ctrl',
    templateUrl: asset.template('root')
  })
  .state('room', {
    url: '/rooms/:token',
    controller: 'room as ctrl',
    templateUrl: asset.template('room')
  });
});
