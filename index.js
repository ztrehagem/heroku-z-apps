var http = require('http');

http.createServer(function(req, resp) {
  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('hello!');
  resp.end();
}).listen(process.env.PORT);
