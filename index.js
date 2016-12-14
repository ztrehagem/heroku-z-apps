require('app-module-path').addPath(__dirname);
require('globals');

const HTTP = require('http');

initEntities().then(startServer).catch((e)=> {
  console.error('failed starting server');
  console.error(e);
});

// --

function initEntities() {
  return require('models').sequelize.sync();
}

function startServer() {
  var server = HTTP.createServer(require('server'));
  require('socket')(server);
  server.listen(process.env.PORT);
  console.log('server has started');
}
