const Rooms = exports;
const Utils = require('utils');
const UUID = require('uuid/v4');

const ROOMS = {};

const Status = Rooms.Status = {
  EXPIRED: 'expired',
  STANDBY: 'standby',
  READY: 'ready',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

Rooms.createRoom = function(roomName) {
  var room = new Room(roomName);
  ROOMS[room.id] = room;
  return room;
};

Rooms.getRoom = function(id) {
  var room = ROOMS[id];
  if (room) room.touch();
  return room;
};

Rooms.getRooms = function() {
  return Utils.values(ROOMS);
};

class Room {
  constructor(roomName) {
    do this.id = UUID(); while (ROOMS[this.id]);
    this.status = Status.STANDBY;
    this.name = roomName || 'ななしべや';
    this.timeout = null;
    this.touchedAt = null;
    this.touch();
    this.createdAt = this.touchedAt;
    this.players = [];
    this.turn = null;
  }

  touch() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(function() {
      delete ROOMS[this.id];
    }, 1000 * 60 * 10); // 10 minutes
    this.touchedAt = Date.now();
  }

  join(userId) {
    if (!this.canJoin() || this.alreadyJoined(userId)) return false;
    this.players.push(userId);
    if (this.players.length == 2) this.status = Status.READY;
    return true;
  }

  canJoin() {
    return this.players.length < 2;
  }

  alreadyJoined(userId) {
    return this.players.includes(userId);
  }

  play(userId) {
    if (this.turn != userId) return false;
    return !!this.switchTurnFrom(userId);
  }

  canPlay() {
    return this.players.length == 2;
  }

  switchTurn(userId) {
    if (!this.alreadyJoined(userId)) return;
    this.turn = this.players.find((player)=> {
      return player != userId;
    });
  }
}
