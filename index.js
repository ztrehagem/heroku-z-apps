var HTTP = require('http');
var router = require('./server/router');
var handler = require('./server/handler');

router.init(JSON.parse(require('fs').readFileSync('./routes.json')));
HTTP.createServer(handler).listen(process.env.PORT);

console.log('server has started');
