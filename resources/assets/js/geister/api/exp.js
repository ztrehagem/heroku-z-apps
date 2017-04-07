app.service('apiExp', function(zpsApiExec) {
  'ngInject';

  this.get = ()=> {
    return zpsApiExec.get('/exp');
  };

  this.delete = ()=> {
    return zpsApiExec.delete('/exp');
  };
});
