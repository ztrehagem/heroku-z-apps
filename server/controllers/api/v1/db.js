var User = require('models/user');

exports.test = (req, resp, params) => {
  User.create({
    name: 'test',
    password: 'pass',
    bio: 'hello'
  }).then((e)=> {
    resp.writeHead(200, {'Content-Type': 'text/plain'});
    resp.write('' + e);
    resp.end('created');
  }).catch((e)=> {
    resp.writeInternalServerError();
  });
};
