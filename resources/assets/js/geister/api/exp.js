app.service('apiExp', function(zpsApiExec) {
  'ngInject';

  this.createRoom = ()=> {
    return zpsApiExec.post('/exp');
  };

  this.get = ()=> {
    return zpsApiExec.get('/exp');
  };

  this.delete = ()=> {
    return zpsApiExec.delete('/exp');
  };
});
