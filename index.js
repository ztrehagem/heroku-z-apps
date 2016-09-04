require('app-module-path').addPath(__dirname);
var HTTP = require('http');
var requireDir = require('require-dir');

initEntities().then(startServer).catch(()=> {
  console.error('failed starting server');
});

// --

function initEntities() {
  return require('models').sequelize.sync();
}

function startServer() {
  var handler = require('server/handler');
  HTTP.createServer(handler).listen(process.env.PORT);
  console.log('server has started');
}
