app.controller('root', function(apiUser) {
  'ngInject';

  this.model = {};

  this.submit = (form) => {
    apiUser.updateName(this.model.name).then((resp)=> {
      console.log(resp);
    });
  };
});
