require('./globals');
const colors = require('utils/colors');
const log = require('utils/log');
const HTTP = require('http');
const URL = require('url');
const PATH = require('path');
const fileServer = new (require('node-static').Server)('public');
const router = require('./router');
const Request = require('./request');
const Response = require('./response');

module.exports = (()=> {
  const server = HTTP.createServer((req, resp)=> handle(req, resp));
  require('./socket')(server);
  return server;
})

function handle(req, resp) {
  try {
    console.log(`${colors.yellow}${log.REQ} ${req.url}${colors.reset}`);
    route(req, resp);
  } catch(e) {
    console.error('Handling Error', e);
    resp.respondMessage(HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

function route(req, resp) {
  const pathname = URL.parse(req.url).pathname;

  if( pathname.startsWith('/api/') )
    routeScripts(req, resp, pathname);
  else
    routeStatics(req, resp, pathname);
}

function routeScripts(req, resp, pathname) {
  const route = router.route(req.method, pathname);

  if( route && typeof route.controller == 'function' ) {
    req = new Request(req);
    resp = new Response(resp);
    req.assosiate(resp);

    return req.sync().then(()=> {
      try {
        route.controller(req, resp, route.params);
      } catch (e) {
        console.warn(`${colors.bgRed}# controller error${colors.reset}`);
        console.warn(e);
        resp.respondMessageJson(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }).catch(()=> {
      console.warn(`${colors.bgRed}# request sync error${colors.reset}`);
      resp.respondMessageJson(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  } else {
    respond(resp, HttpStatus.NOT_FOUND);
  }
}

function routeStatics(req, resp, pathname) {
  const match = /^\/[^./]+$/.test(pathname);

  if (!match)
    serveStaticFile(req, resp);
  else
    respond(resp, HttpStatus.FOUND, {[Response.Header.LOCATION]: `${pathname}/`});
}

function serveStaticFile(req, resp) {
  fileServer.serve(req, resp, (e, res)=> {
    if (e) respond(resp, e.status || HttpStatus.INTERNAL_SERVER_ERROR);
    else console.log(`${colors.green}${log.RES} static file${colors.reset}`);
  });
}

function respond(resp, status, headers = {}) {
  headers[Response.Header.CONTENT_TYPE] = headers[Response.Header.CONTENT_TYPE] || ContentType.TEXT;

  console.log(`${colors.green}${log.RES} ${status}${colors.reset}`);
  console.log(`${colors.green}${JSON.stringify(headers)}${colors.reset}`);

  Object.keys(headers).forEach((key)=> {
    resp.setHeader(key, headers[key]);
  });
  resp.writeHead(status);
  resp.end(HttpStatus[status]);
}
