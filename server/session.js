const redis = require('server/redis');
const utils = require('utils');
const redisUtils = require('utils/redis');
const colors = require('utils/colors');
const UUID = require('uuid/v4');

const KEY_PREFIX = 'session';
const CREATED_AT = 'createdAt';
const EXPIRE = '' + (60 * 60 * 2); // 2h
const MAKE_KEY = token => `${KEY_PREFIX}:${token}`;

const execAsyncTouch = (key, fn)=>
  fn(redis.multi())
  .expire(key, EXPIRE)
  .execAsync();

module.exports = class Session {
  static get(token) {
    const key = MAKE_KEY(token);

    return redis.multi().hgetall(key).expire(key, EXPIRE).execAsync().then(replies => {
      return replies[0] && new Session(token, replies[0]);
    });
  }

  static create() {
    const token = UUID();
    const raw = redisUtils.buildHash({
      [CREATED_AT]: new Date().toUTCString(),
      id: UUID()
    });
    const values = utils.joinArray(utils.objectToArray(raw));
    const key = MAKE_KEY(token);

    return redis.multi().hmset(key, values).expire(key, EXPIRE).execAsync().then(replies => {
      console.log('# created new session');
      return new Session(token, raw);
    });
  }

  constructor(token, raw) {
    this.token = token;
    this.data = redisUtils.parseHash(raw);
  }

  serializeForMe(target) {
    const s = {
      geister: (o => o && {
        name: o.name
      })(this.data.geister)
    };
    return target ? s[target] : s;
  }

  put(field, value) {
    const key = MAKE_KEY(this.token);
    return execAsyncTouch(key, m => m.hset(key, field, value))
      .then(replies => Object.assign(this.data, redisUtils.parseHash({[field]: value})))
      .then(()=> this);
  }

  reload() {
    const key = MAKE_KEY(this.token);
    return execAsyncTouch(key, m => m.hgetall(key))
      .then(replies => Object.assign(this.data, redisUtils.parseHash(replies[0])))
      .then(()=> this);
  }
};
