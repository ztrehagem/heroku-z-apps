module.exports = handler;

var URL = require('url');
var PATH = require('path');
var router = require('z-router')(require('./routes'), {
  ctrlDir: 'server/controllers'
});
var fileServer = new (require('node-static').Server)('public');
var responseUtils = require('./utils/response-utils');

console.log(router.routesToString());


function handler(req, resp) {
  Object.assign(resp, responseUtils);

  console.log('requested:', req.url);

  var pathname = PATH.resolve(URL.parse(req.url).pathname);

  if( pathname.startsWith('/api/') ) {
    var route = router.route(req.method, pathname);
    if( route && typeof route.controller == 'function' )
      return route.controller(req, resp, route.params);
    return resp.writeNotFound();
  } else if( !PATH.extname(pathname).length ) {
    fileServer.serveFile('/index.html', 200, {}, req, resp);
  } else {
    fileServer.serve(req, resp, function(e, res) {
      if( e && e.status == 404 ) resp.writeNotFound();
    });
  }
}
