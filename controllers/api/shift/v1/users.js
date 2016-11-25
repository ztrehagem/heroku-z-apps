var ctrl = exports;
var db = require('models');
var $resp = require('utils/response');
var $req = require('utils/request');
var Serializer = require('serializer');

const ACCEPT_PARAMS = ['name', 'displayName', 'bio'];
const REQUIRED_PARAMS = ['name', 'displayName'];

ctrl.index = (req, resp, params)=> {
  console.log('user index', params);
  db.user.findAll().then((e)=> {
    resp.respondJson(e.map(Serializer.user));
  }).catch((e)=> {
    resp.respondMessageJson(HttpStatus.INTERNAL_SERVER_ERROR);
  });
};

ctrl.create = (req, resp, uriParams)=> {
  console.log('user create', uriParams);

  var params;

  try {
    params = req.getBodyAsJson();
    if(!REQUIRED_PARAMS.every((key)=> {
      return key in params;
    })) throw new Error('request has not enough params.');
  } catch(e) {
    console.warn('' + e);
    return resp.respondMessageJson(HttpStatus.BAD_REQUEST);
  }

  db.user.create(ACCEPT_PARAMS.reduce((user, key)=> {
    user[key] = params[key];
    return user;
  }, {})).then((e)=> {
    resp.respondMessageJson(HttpStatus.CREATED, Serializer.user(e));
  }).catch((e)=> {
    resp.respondMessageJson(HttpStatus.BAD_REQUEST);
  });
};

ctrl.update = (req, resp, uriParams)=> {
  console.log('user update', uriParams);

  try {
    params = req.getBodyAsJson();
  } catch(e) {
    console.warn('' + e);
    return resp.respondMessageJson(HttpStatus.BAD_REQUEST);
  }

  db.user.update(ACCEPT_PARAMS.reduce((user, key)=> {
    user[key] = params[key];
    return user;
  }, {}), {where: {id: uriParams.id}}).then((e)=> {
    resp.respondMessageJson(HttpStatus.NO_CONTENT);
  }).catch((e)=> {
    resp.respondMessageJson(HttpStatus.BAD_REQUEST);
  });
};
