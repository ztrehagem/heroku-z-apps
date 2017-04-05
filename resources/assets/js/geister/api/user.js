app.service('apiUser', function(zpsApiExec) {
  'ngInject';

  this.updateName = (name) => {
    return zpsApiExec.put('/user', null, {name: name});
  };
});
