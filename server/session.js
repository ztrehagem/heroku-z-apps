const redis = require('./redis');
const utils = require('utils');
const colors = require('utils/colors');
const UUID = require('uuid/v4');

const KEY_PREFIX = 'session';
const CREATED_AT = 'createdAt';
const EXPIRE = '' + (60 * 60 * 2); // 2h
const MAKE_KEY = token => `${KEY_PREFIX}:${token}`;

module.exports = class Session {
  static get(token) {
    const key = MAKE_KEY(token);

    return redis.multi().hgetall(key).expire(key, EXPIRE).execAsync().then(replies => {
      return replies[0] && new Session(token, replies[0]);
    });
  }

  static create() {
    const token = UUID();
    const raw = {[CREATED_AT]: new Date().toUTCString()};
    const values = utils.joinArray(utils.objectToArray(raw));
    const key = MAKE_KEY(token);

    return redis.multi().hmset(key, values).expire(key, EXPIRE).execAsync().then(replies => {
      console.log('# created new session');
      return new Session(token, raw);
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
