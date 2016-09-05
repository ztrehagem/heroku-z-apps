var URL = require('url');
var PATH = require('path');
var router = initRouter();
var fileServer = new (require('node-static').Server)('public');
var $resp = require('utils/response');
var $req = require('utils/request');

module.exports = (req, resp)=> {
  try {
    handle(req, resp);
  } catch (e) {
    console.error('Internal Server Error', e);
    $resp.writeInternalServerError(resp);
  }
};

function handle(req, resp) {
  console.log('------------ requested:', req.url);
  route(req, resp);
}

function route(req, resp) {
  var pathname = PATH.resolve(URL.parse(req.url).pathname);

  if( pathname.startsWith('/api/') )
    routeScripts(req, resp, pathname);
  else
    routeStatics(req, resp, pathname);
}

function routeScripts(req, resp, pathname) {
  var route = router.route(req.method, pathname);

  if( route && typeof route.controller == 'function' ) {
    $req.sync(req).then((extendedReq)=> {
      route.controller(extendedReq, resp, route.params);
    });
  } else {
    $resp.writeNotFound(resp);
  }
}

function routeStatics(req, resp, pathname) {
  if( !PATH.extname(pathname).length ) {
    var match = pathname.match(/^\/(\w+?)(?:\/.*)?$/);
    var filename = (match ? `/${match[0]}` : '') + '/index.html';
    console.log('serve index file', filename);
    fileServer.serveFile(filename, 200, {}, req, resp).on('error', ()=> {
      $resp.writeNotFound(resp);
    });
  } else {
    console.log('serve static file');
    fileServer.serve(req, resp, (e, res)=> {
      if( e && e.status == 404 ) return $resp.writeNotFound(resp);
    });
  }
}

function initRouter() {
  var router = require('z-router')(require('server/routes'));
  console.log(router.routesToString());
  return router;
}
