const Utils = require('utils');
const UUID = require('uuid/v4');

const ROOMS = {};

exports.createRoom = function() {
  var room = new Room();
  ROOMS[room.id] = room;
  return room;
};

exports.getRoom = function(id) {
  var room = ROOMS[id];
  if (room) room.touch();
  return room;
};

exports.getRooms = function() {
  return Utils.values(ROOMS);
};

class Room {
  constructor() {
    do this.id = UUID(); while (ROOMS[this.id]);
    this.touch();
    this.createdAt = this.touchedAt;
  }

  touch() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(function() {
      delete ROOMS[this.id];
    }, 1000 * 60 * 10); // 10 minutes
    this.touchedAt = Date.now();
  }
}
