var URL = require('url');
var PATH = require('path');
var router = initRouter();
var fileServer = new (require('node-static').Server)('public');
const Request = require('./request');
const Response = require('./response');

module.exports = (req, resp)=> {
  try {
    handle(new Request(req), new Response(resp));
  } catch (e) {
    console.error('Handling Error', e);
    resp.respondMessage(HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

function handle(req, resp) {
  console.log('------------ requested:', req.raw.url);
  route(req, resp);
}

function route(req, resp) {
  var pathname = PATH.resolve(URL.parse(req.raw.url).pathname);

  if( pathname.startsWith('/api/') )
    routeScripts(req, resp, pathname);
  else
    routeStatics(req, resp, pathname);
}

function routeScripts(req, resp, pathname) {
  var route = router.route(req.raw.method, pathname);

  if( route && typeof route.controller == 'function' ) {
    req.sync().then(()=> {
      route.controller(req, resp, route.params);
    }).catch(()=> {
      console.warn('request sync error');
      resp.respondMessageJson(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  } else {
    resp.respondMessageJson(HttpStatus.NOT_FOUND);
  }
}

function routeStatics(req, resp, pathname) {
  if( !PATH.extname(pathname).length ) {
    var match = pathname.match(/^\/(\w+?)(?:\/.*)?$/);
    var filename = (match ? `/${match[0]}` : '') + '/index.html';
    console.log('serve index file', filename);
    fileServer.serveFile(filename, 200, {}, req.raw, resp.raw).on('error', ()=> {
      resp.respondMessage(HttpStatus.NOT_FOUND);
    });
  } else {
    console.log('serve static file');
    fileServer.serve(req.raw, resp.raw, (e, res)=> {
      if (e && e.status == 404) return resp.respondMessage(HttpStatus.NOT_FOUND);
    });
  }
}

function initRouter() {
  var router = require('z-router')(require('server/routes'));
  console.log(router.routesToString());
  return router;
}
