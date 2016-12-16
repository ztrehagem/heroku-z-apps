modules.api

.service('apiRooms', function($http) {
  'ngInject';

  var prefix = '/api/geister/v1/rooms';

  this.getRooms = function() {
    return $http.get(prefix).then(function(resp) {
      return resp.data;
    });
  };

  this.createRoom = function() {
    return $http.post(prefix).then(function(resp) {
      return resp.data;
    });
  };

  this.joinRoom = function(roomId) {
    return $http.post(prefix + '/' + roomId);
  };
});
