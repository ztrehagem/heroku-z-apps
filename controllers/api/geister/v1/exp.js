exports.get = (req, resp, params)=> {
  console.log('session');
  console.log(req.session);
  resp.respondMessageJson(HttpStatus.NO_CONTENT);
};

exports.put = (req, resp, params)=> {
  resp.respondMessageJson(HttpStatus.NO_CONTENT);
};

exports.delete = (req, resp, params)=> {
  resp.respondMessageJson(HttpStatus.NO_CONTENT);
};
