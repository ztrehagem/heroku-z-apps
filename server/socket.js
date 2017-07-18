module.exports = function(httpServer) {
  var io = require('socket.io')(httpServer);
  require('server/geister/socket')(io.of('/geister'));
};
