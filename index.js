require('app-module-path').addPath(__dirname);
require('globals');

var HTTP = require('http');

initEntities().then(startServer).catch((e)=> {
  console.error('failed starting server');
  console.error(e);
});

// --

function initEntities() {
  return require('models').sequelize.sync();
}

function startServer() {
  var server = require('server');
  HTTP.createServer(server).listen(process.env.PORT);
  console.log('server has started');
}
