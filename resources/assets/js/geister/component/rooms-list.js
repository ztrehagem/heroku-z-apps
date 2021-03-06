app.component('roomsList', {
  templateUrl: asset.template('rooms-list'),
  controller($state, apiRooms, moment, me, $filter) {
    'ngInject';

    this.$onInit = ()=> {
      this.reload();
    };

    this.create = ()=> {
      this.creating = apiRooms.create().then(room => {
        console.log('created new room:', room);
        $state.go('room', {token: room.token});
      });
    };

    this.reload = ()=> {
      this.reloading = apiRooms.index().then(rooms => {
        rooms.forEach(room => room.createdAt = moment.parseFromApi(room.createdAt));
        rooms.sort((a, b)=> b.createdAt.toDate() - a.createdAt.toDate());
        this.rooms = rooms;
      });
    };

    this.join = (room)=> {
      const token = room.token;
      this.joining = apiRooms.join(token).then(resp => {
        console.log('join ok', resp);
        $state.go('room', {token: token});
      }).catch(resp => {
        console.log('join failed', resp);
      });
    };

    this.disableCreateButton = ()=> {
      return !me.name || $filter('qstate')(this.creating, 'pending');
    };

    this.disableJoinButton = (room)=> {
      return !me.name || room.status != 'accepting' || $filter('qstate')(this.joining, 'pending');
    };
  }
});
