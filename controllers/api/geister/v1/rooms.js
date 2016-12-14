const Rooms = require('geister/rooms');
const Serializer = require('serializer');
const Utils = require('utils');

exports.index = function(req, resp, params) {
  resp.respondJson(Rooms.getRooms().map(Serializer.geisterRooms));
};

exports.create = function(req, resp, params) {
  var room = Rooms.createRoom();
  // join user with session id
  // room.join(session)
  resp.respondJson(Serializer.geisterRooms(room));
};

exports.view = function(req, resp, params) {

};

exports.join = function(req, resp, params) {

};

exports.leave = function(req, resp, params) {

};
