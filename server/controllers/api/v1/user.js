var ctrl = module.exports;
var User = require('server/models/user');
var $resp = require('server/utils/response');
var Serializer = require('server/serializer');

ctrl.index = (req, resp, params)=> {
  console.log('user index', params);
  User.findAll().then((e)=> {
    $resp.writeJson(resp, e.map(Serializer.user));
  }).catch((e)=> {
    $resp.writeInternalServerError(resp);
  });
};

ctrl.create = (req, resp, params)=> {
  console.log('user create', params);
  User.create({
    name: 'test',
    password: 'pass',
    bio: 'hello'
  }).then((e)=> {
    console.log(''+e);
    $resp.writeJson(resp, {
      user: 'created'
    });
  }).catch((e)=> {
    $resp.writeInternalServerError(resp);
  });
};

ctrl.update = (req, resp, params)=> {
  console.log('user update', params);
  resp.writeHead(200, {'Content-Type': 'text/plain'});
  resp.write('user update!');
  resp.end();
};
