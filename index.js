require('app-module-path').addPath(__dirname + '/server');
var HTTP = require('http');
var handler = require('handler');

initEntities().then(startServer);

// --

function initEntities() {
  require('require-dir')('./server/models');
  return require('entity').sync();
}

function startServer() {
  HTTP.createServer(handler).listen(process.env.PORT);
  console.log('server has started');
}
