module.exports = handler;

var URL = require('url');
var PATH = require('path');
var router = require('z-router')(require('./routes'));
var fileServer = new (require('node-static').Server)('./public');
var responseUtils = require('./utils/response-utils');

console.log(router.routesToString());


function handler(req, resp) {
  Object.assign(resp, responseUtils);

  console.log('requested:', req.url);

  if( !route(req, resp) ) return resp.writeNotFound();
}

function route(req, resp) {
  var pathname = PATH.resolve(URL.parse(req.url).pathname);
  if( !pathname.startsWith('/api/') ) {
    if( !PATH.extname(pathname).length ) {
      fileServer.serveFile('/index.html', 200, {}, req, resp);
    } else {
      fileServer.serve(req, resp, function(e, res) {
        if( e && e.status == 404 ) {
          resp.writeNotFound();
        }
      });
    }
    return true;
  }
  var route = router.route(req.method, pathname);
  if( !route ) return;
  var ctrlModule = require('./controllers' + route.ctrlPath);
  if( !ctrlModule ) { console.warn('undefined controller module'); return; }
  var ctrl = ctrlModule[route.actionName];
  if( typeof ctrl != 'function' ) { console.warn('undefined action method'); return; }
  ctrl(req, resp, route.params);
  return true;
}
