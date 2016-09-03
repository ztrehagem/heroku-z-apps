var ctrl = module.exports = {};

ctrl.index = function(req, resp, params) {
  console.log('user index', params);
  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('user index!');
  resp.end();
};

ctrl.create = function(req, resp, params) {
  console.log('user create', params);
  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('user create!');
  resp.end();
};

ctrl.update = function(req, resp, params) {
  console.log('user update', params);
  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('user update!');
  resp.end();
};
