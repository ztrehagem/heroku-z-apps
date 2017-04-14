app.service('apiRooms', function(zpsApiExec) {
  'ngInject';

  this.create = ()=> zpsApiExec.post('/rooms').then(resp => resp.data);
  this.index = ()=> zpsApiExec.get('/rooms').then(resp => resp.data);
});
