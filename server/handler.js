var URL = require('url');
var PATH = require('path');
var router = initRouter();
var fileServer = new (require('node-static').Server)('public');
var responseUtils = require('utils/response-utils');

module.exports = (req, resp)=> {
  try {
    extendUtils(req, resp);
    handle(req, resp);
  } catch (e) {
    console.error('Internal Server Error', e);
    resp.writeInternalServerError();
  }
};

function handle(req, resp) {
  console.log('requested:', req.url);
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
    route.controller(req, resp, route.params);
  } else {
    resp.writeNotFound();
  }
}

function routeStatics(req, resp, pathname) {
  if( !PATH.extname(pathname).length ) {
    fileServer.serveFile('/index.html', 200, {}, req, resp);
  } else {
    fileServer.serve(req, resp, (e, res)=> {
      if( e && e.status == 404 ) resp.writeNotFound();
    });
  }
}

function extendUtils(req, resp) {
  // Object.assign(req, requestUtils);
  Object.assign(resp, responseUtils);
}

function initRouter() {
  var router = require('z-router')(require('./routes'), {
    ctrlDir: 'server/controllers'
  });
  console.log(router.routesToString());
  return router;
}
