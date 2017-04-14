app.controller('root', function($scope, apiUser, apiRooms) {
  'ngInject';

  this.createRoom = ()=> {
    apiRooms.create().then(token => {
      console.log('created new room:', token);
    });
  };

  this.reload = ()=> {
    return apiRooms.index().then(rooms => $scope.rooms = rooms);
  };


  this.reload();
});
