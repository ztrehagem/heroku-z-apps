module.exports = handler;

var URL = require('url');
var router = require('z-router')(require('./routes'));
console.log(router.routesToString());
var extendResponse = require('./utils/extend-response');

function handler(req, resp) {
  resp = extendResponse(resp);

  console.log('requested:', req.url);

  if( !route(req, resp) ) return resp.writeNotFound();

  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('hello!');
  resp.end();
}

function route(req, resp) {
  var route = router.route(req.method, URL.parse(req.url).pathname);
  if( !route ) return;
  var ctrlModule = require('./controllers' + route.ctrlPath);
  if( !ctrlModule ) { console.warn('undefined controller module'); return; }
  var ctrl = ctrlModule[route.actionName];
  if( typeof ctrl != 'function' ) { console.warn('undefined action method'); return; }
  ctrl(req, resp, route.params);
  return true;
}
