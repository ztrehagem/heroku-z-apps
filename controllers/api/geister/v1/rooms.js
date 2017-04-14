const Room = require('server/geister/room');

exports.index = (req, resp, uriParams)=> {
  Room.index().then((rooms = [])=> {
    resp.respondJson(rooms.map(room => room.serializeSummary()));
  });
};

exports.create = (req, resp, uriParams)=> {
  const name = getName(req.session);
  if (!name) {
    return resp.respondMessageJson(HttpStatus.BAD_REQUEST);
  }

  Room.create(req.session.data.id, name).then((room)=> {
    resp.respondJson(room && room.serializeSummary());
  });
};

exports.join = (req, resp, uriParams)=> {
  const name = getName(req.session);
  if (!name) {
    return resp.respondMessageJson(HttpStatus.BAD_REQUEST);
  }

  const token = uriParams.token;
  Room.join(token, req.session.data.id, name)
    .then(()=> resp.respondMessageJson(HttpStatus.NO_CONTENT))
    .catch(()=> resp.respondMessageJson(HttpStatus.FORBIDDEN));
};

exports.leave = (req, resp, uriParams)=> {
  const token = uriParams.token;
};

function getName(session) {
  const geister = session.data.geister;
  return (geister && geister.name && geister.name.length) ? geister.name : null;
}
