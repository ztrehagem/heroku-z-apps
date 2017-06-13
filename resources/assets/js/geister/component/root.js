app.component('root', {
  templateUrl: asset.template('root'),
  controller($scope, $state, apiMe, apiRooms) {
    'ngInject';

    // this.updateName = ()=> {
    //   apiMe.updateName(this.model.name).then(resp => this.model.name = resp.name);
    // };

    this.createRoom = ()=> {
      apiRooms.create().then(room => {
        console.log('created new room:', room);
        $state.go('room', {token: room.token});
      });
    };

    this.reload = ()=> {
      return apiRooms.index().then(rooms => $scope.rooms = rooms);
    };

    this.join = (room)=> {
      const token = room.token;
      apiRooms.join(token).then(resp => {
        console.log('join ok', resp);
        $state.go('room', {token: token});
      }).catch(resp => {
        console.log('join failed', resp);
      });
    };


    //-- initializes

    // apiMe.get().then(resp => this.name = resp.name);
    this.reload();
  }
});
