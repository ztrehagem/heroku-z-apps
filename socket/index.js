module.exports = function(httpServer) {
  var io = require('socket.io')(httpServer);
  require('geister/socket')(io.of('/geister'));
};
