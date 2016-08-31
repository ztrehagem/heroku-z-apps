var HTTP = require('http');
var handler = require('./server/handler');
HTTP.createServer(handler).listen(process.env.PORT);
console.log('server has started');
