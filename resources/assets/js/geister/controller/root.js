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

  this.join = (room)=> {
    const token = room.token;
    apiRooms.join(room.token).then(resp => {
      console.log('join ok', resp);
    }).catch(resp => {
      console.log('join failed', resp);
    });
  };


  //-- initializes

  this.model = {};
  apiMe.get().then(resp => this.model.name = resp.name);
  this.reload();
});
