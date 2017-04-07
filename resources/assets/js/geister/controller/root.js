app.controller('root', function(apiUser, apiExp) {
  'ngInject';

  this.model = {};

  this.submit = (form) => {
    apiUser.updateName(this.model.name).then((resp)=> {
      console.log(resp);
    });
  };

  this.get = ()=> {
    apiExp.get().then((resp)=> {
      console.log(resp);
    });
  };

  this.delete = ()=> {
    apiExp.delete().then((resp)=> {
      console.log(resp);
    });
  };
});
