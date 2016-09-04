require('app-module-path').addPath(__dirname);

var HTTP = require('http');

initEntities().then(startServer).catch(()=> {
  console.error('failed starting server');
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
