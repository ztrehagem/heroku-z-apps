module.exports = handler;

var URL = require('url');
var router = require('./router')(require('./routes'));
router.logRoutes();
var extendResponse = require('./utils/extend-response');

function handler(req, resp) {
  resp = extendResponse(resp);
  handlerCore(req, resp);
}

function handlerCore(req, resp) {
  var pathname = URL.parse(req.url).pathname;
  console.log('requested:', pathname);

  var route = router.route(pathname);
  if( !route ) { return resp.writeNotFound(); }
  require('./controllers' + route.ctrlPath)[route.actionName](req, resp, route.params);

  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('hello!');
  resp.end();
}
