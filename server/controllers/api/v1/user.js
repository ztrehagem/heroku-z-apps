var ctrl = exports;
var User = require('server/models/user');
var $resp = require('server/utils/response');
var $req = require('server/utils/request');
var Serializer = require('server/serializer');

ctrl.index = (req, resp, params)=> {
  console.log('user index', params);
  User.findAll({order: 'id ASC'}).then((e)=> {
    $resp.writeJson(resp, e.map(Serializer.user));
  }).catch((e)=> {
    $resp.writeInternalServerError(resp);
  });
};

ctrl.create = (req, resp, uriParams)=> {
  console.log('user create', uriParams);

  var params;

  try {
    params = $req.getAsJson(req);
    if(!['name'].every((key)=> {
      return key in params;
    })) throw new Error('request has not enough params.');
  } catch(e) {
    console.warn('' + e);
    return $resp.writeBadRequest(resp, $resp.Type.JSON);
  }

  User.create(['name','bio'].reduce((user, key)=> {
    user[key] = params[key];
    return user;
  }, {})).then((e)=> {
    $resp.writeCreated(resp, $resp.Type.JSON, Serializer.user(e));
  }).catch((e)=> {
    $resp.writeBadRequest(resp, $resp.Type.JSON);
  });
};

ctrl.update = (req, resp, uriParams)=> {
  console.log('user update', uriParams);

  try {
    params = $req.getAsJson(req);
  } catch(e) {
    console.warn('' + e);
    return $resp.writeBadRequest(resp, $resp.Type.JSON);
  }

  User.update(['name','bio'].reduce((user, key)=> {
    user[key] = params[key];
    return user;
  }, {}), {where: {id: uriParams.id}}).then((e)=> {
    $resp.writeNoContent(resp, $resp.Type.JSON);
  }).catch((e)=> {
    $resp.writeBadRequest(resp, $resp.Type.JSON);
  });
};
