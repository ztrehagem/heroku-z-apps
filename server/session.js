const redis = require('./redis');
const UUID = require('uuid/v4');

const sessionMock = {token: 'session-token-mock'};

module.exports = class Session {
  static get(token) {
    // TODO touch
    return sessionMock;
  }
  static create() {
    return sessionMock;
  }
};

/*
session on redis
  keys pattern: `session:{token}`
  value type: hash
*/

// const sessions = {};
//
// exports.createSession = function() {
//   var id = null;
//   do id = UUID(); while (sessions[id]);
//   var session = sessions[id] = {
//     id: id,
//     createdAt: Date.now()
//   };
//   touch(session);
//   return session;
// };
//
// exports.getSession = function(id) {
//   return sessions[id];
// };
//
// exports.getSessions = function() {
//   return Utils.values(sessions);
// };
//
// exports.touch = function(session) {
//   touch(session);
// };
//
// function touch(session) {
//   if (session.timeout) clearTimeout(session.timeout);
//   session.timeout = setTimeout(function() {
//     delete sessions[session.id];
//   }, 1000 * 60 * 10); // 10 minutes
//   session.touchedAt = Date.now();
// }
