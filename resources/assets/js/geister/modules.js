var modules = {};

modules.api = angular.module('api', []);
modules.services = angular.module('services', []);
modules.app = angular.module('app', [
  'services',
  'api'
]);
