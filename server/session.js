const redis = require('./redis');
const utils = require('utils');
const colors = require('utils/colors');
const UUID = require('uuid/v4');

const KEY_PREFIX = 'session';
const CREATED_AT = 'createdAt';
const EXPIRE = '' + (60 * 60 * 2); // 2h

module.exports = class Session {
  static get(token) {
    const key = `${KEY_PREFIX}:${token}`;

    return new Promise((resolve, reject)=> {
      redis.multi().hgetall(key).expire(key, EXPIRE).exec((err, replies)=> {
        if (err)
          reject(err);
        else
          resolve(replies[0] && new Session(token, replies[0]));
      });
    });
  }

  static create() {
    console.log('# create new session');
    const token = UUID();
    const raw = {[CREATED_AT]: new Date().toUTCString()};
    const values = utils.joinArray(utils.objectToArray(raw));
    const key = `${KEY_PREFIX}:${token}`;

    return new Promise((resolve, reject)=> {
      redis.multi().hmset(key, values).expire(key, EXPIRE).exec((err, replies)=> {
        if (err)
          reject(err);
        else
          resolve(new Session(token, raw));
      });
    });
  }

  constructor(token, raw) {
    this.token = token;
    this.data = {};
    Object.keys(raw).forEach((rawKey)=> {
      const value = raw[rawKey];
      const match = rawKey.match(/[^:]+/g);
      if (!match || !match.length) return;
      const key = match.pop();
      const namespaces = match;
      namespaces.reduce((target, namespace)=> {
        return (target[namespace] = target[namespace] || {});
      }, this.data)[key] = value;
    });
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
