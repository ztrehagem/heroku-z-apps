const app = angular.module('app', [
  'zapps.apiExec',
  'ui.router',
]);

const asset = {
  template: name => `template/${name}.html`
};
