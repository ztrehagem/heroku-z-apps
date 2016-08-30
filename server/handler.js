module.exports = handler;

var URL = require('url');
var router = require('./router');
var extendResponse = require('./utils/extend-response');

function handler(req, resp) {
  resp = extendResponse(resp);
  handlerCore(req, resp);
}

function handlerCore(req, resp) {
  var pathname = URL.parse(req.url).pathname;
  console.log('requested:', pathname);

  var controller = router(pathname);
  if( !controller ) { return resp.writeNotFound(); }
  controller(req, resp);

  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('hello!');
  resp.end();
}
