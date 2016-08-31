var HTTP = require('http');
var router = require('./server/router');
var handler = require('./server/handler');

router.init(require('./routes'));
HTTP.createServer(handler).listen(process.env.PORT);

console.log('server has started');
