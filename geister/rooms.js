const Utils = require('utils');

const ROOMS = {};

exports.createRoom = function() {
  var id = null;

  do id = hash(); while (ROOMS[id]);
  var room = ROOMS[id] = {
    id: id,
    createdAt: Date.now()
  };
  touch(room);

  return room;
};

exports.getRoom = function(id) {
  var room = ROOMS[id];
  if (room) touch(room);
  return room;
};

exports.getRooms = function() {
  return Utils.values(ROOMS);
};

function touch(room) {
  if (room.timeout) clearTimeout(room.timeout);
  room.timeout = setTimeout(function() {
    delete ROOMS[room.id];
  }, 1000 * 60 * 10); // 10 minutes
  room.touchedAt = Date.now();
}

var id = 0;

function hash() {
  var shasum = require('crypto').createHash('sha1');
  shasum.update(require('dateformat')(new Date(), 'yyyymmddHHMMss'));
  return shasum.digest('hex');
}
