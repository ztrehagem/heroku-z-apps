const Room = require('server/geister/room');

exports.index = (req, resp, params)=> {
  Room.index().then((rooms = [])=> {
    resp.respondJson(rooms.map(room => room.serializeSummary()));
  });
};

exports.create = (req, resp, params)=> {
  Room.create(req.session.data.id).then((room)=> {
    resp.respondJson(room && room.serializeSummary());
  });
};

exports.join = (req, resp, params)=> {
  const token = params.token;
};

exports.leave = (req, resp, params)=> {
  const token = params.token;
};
