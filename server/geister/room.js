const redis = require('server/redis');
const utils = require('utils');
const redisUtils = require('utils/redis');
const UUID = require('uuid/v4');

const KEY_PREFIX = 'geister';
const KEY_ROOM = 'room';
const KEY_FIELD = 'field';
const KEY_MOVES = 'moves';
const CREATED_AT = 'createdAt';
const EXPIRE = '' + (60 * 20); // 20 minutes
const MAKE_KEY_ROOM = token => `${KEY_PREFIX}:${KEY_ROOM}:${token}`;
const MAKE_KEY_FIELD = token => `${KEY_PREFIX}:${KEY_FIELD}:${token}`;
const MAKE_KEY_MOVES = token => `${KEY_PREFIX}:${KEY_MOVES}:${token}`;

const execAsyncTouch = (fn, token)=>
  fn(redis.multi())
  .expire(MAKE_KEY_ROOM(token), EXPIRE)
  .expire(MAKE_KEY_MOVES(token), EXPIRE)
  .expire(MAKE_KEY_FIELD(token), EXPIRE);

module.exports = class Room {
  static getFull(token) {
    const rkey = MAKE_KEY_ROOM(token);
    const fkey = MAKE_KEY_FIELD(token);
    const mkey = MAKE_KEY_MOVES(token);
    return execAsyncTouch(m => m.hgetall(rkey).lrange(fkey, 0, -1).lrange(mkey, 0, -1), token)
      .then(replies => new Room(token, replies[0], replies[1], replies[2]));
  }

  static getSummary(token) {
    const key = MAKE_KEY_ROOM(token);
    return execAsyncTouch(m => m.hgetall(key), token)
      .then(replies => new Room(token, replies[0]));
  }

  static getDetails(token) {
    const fkey = MAKE_KEY_FIELD(token);
    const mkey = MAKE_KEY_MOVES(token);
    return execAsyncTouch(m => m.lrange(fkey, 0, -1).lrange(mkey, 0, -1), token)
      .then(replies => new Room(token, null, replies[0], replies[1]));
  }

  static create(hostId) {
    const token = UUID();
    const rawRoom = redisUtils.buildHash({
      [CREATED_AT]: new Date().toUTCString(),
      player: {
        host: hostId
      }
    });
    const values = utils.joinArray(utils.objectToArray(rawRoom));
    const key = MAKE_KEY_ROOM(token);

    return execAsyncTouch(m => m.hmset(key, values), token)
      .then((replies)=> {
        console.log('# created new geister-room');
        return new Room(token, rawRoom);
      });
  }

  constructor(token, rawRoom, rawField, rawMoves) {
    this.token = token;
    this.room = rawRoom && redisUtils.parseHash(rawRoom);
    this.field = rawField;
    this.moves = rawMoves;
  }
};
