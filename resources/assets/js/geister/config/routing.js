app.config(function($urlRouterProvider) {
  'ngInject';

  $urlRouterProvider.when('', '/');
});

app.config(function($stateProvider) {
  'ngInject';

  $stateProvider
  .state('root', {
    url: '/',
    component: 'root'
  })
  .state('room', {
    url: '/rooms/:token',
    component: 'room'
  });
});
