app.service('me', function(apiMe) {
  'ngInject';

  this.initialized = apiMe.get().then(me => Object.assign(this, me)).then(()=> {
    console.log(this);
  });
  this.update = (arg)=> apiMe.update(arg).then(me => Object.assign(this, me));
});

app.run(function($rootScope, $injector) {
  let me = null;

  Object.defineProperty($rootScope, 'me', {
    get() {
      return me || (me = $injector.get('me'));
    }
  });
});
