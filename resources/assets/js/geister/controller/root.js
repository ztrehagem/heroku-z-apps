app.controller('root', function($scope, apiMe, apiRooms) {
  'ngInject';

  this.updateName = ()=> {
    apiMe.updateName(this.model.name).then(resp => this.model.name = resp.name);
  };

  this.createRoom = ()=> {
    apiRooms.create().then(room => {
      console.log('created new room:', room);
    });
  };

  this.reload = ()=> {
    return apiRooms.index().then(rooms => $scope.rooms = rooms);
  };


  //-- initializes

  this.model = {};
  apiMe.get().then(resp => this.model.name = resp.name);
  this.reload();
});
