app.service('apiMe', function(zpsApiExec) {
  'ngInject';

  this.get = ()=> zpsApiExec.get('/me').then(resp => resp.data);
  this.update = ({
    name
  })=> zpsApiExec.put('/me', null, {
    name
  }).then(resp => resp.data);
});
