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
  .expire(MAKE_KEY_FIELD(token), EXPIRE)
  .execAsync();

module.exports = class Room {
  static index() {
    return redis.keysAsync(MAKE_KEY_ROOM('*'))
      .then(keys => Promise.all(keys.map(key => redis.hgetallAsync(key).then(reply => ({
        token: new RegExp(`^${MAKE_KEY_ROOM('(.*)')}$`).exec(key)[1],
        raw: reply
      })))))
      .then(results => results.map(r => new Room(r.token, r.raw)))
      .catch(err => null);
  }

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

  static create(hostId, hostName) {
    const token = UUID();
    const rawRoom = redisUtils.buildHash({
      [CREATED_AT]: new Date().toUTCString(),
      player: {
        host: hostId
      },
      playerName: {
        host: hostName
      }
    });
    const values = utils.joinArray(utils.objectToArray(rawRoom));
    const key = MAKE_KEY_ROOM(token);

    return execAsyncTouch(m => m.hmset(key, values), token)
      .then((replies)=> {
        console.log('# created new geister-room');
        return new Room(token, rawRoom);
      })
      .catch((err)=> {
        console.warn('# couldnt create new geister-room');
        console.warn(err);
        return null;
      });
  }

  static join(token, guestId, guestName) {
    const key = MAKE_KEY_ROOM(token);
    return redis.hgetAsync(key, 'player:host')
      .then(reply => (reply != guestId) ? Promise.resolve() : Promise.reject())
      .then(()=> execAsyncTouch(m => m.hsetnx(key, 'player:guest', guestId).hsetnx(key, 'playerName:guest', guestName), token))
      .then(replies => (replies[0] == 1) ? Promise.resolve() : Promise.reject());
  }

  constructor(token, rawRoom, rawField, rawMoves) {
    this.token = token;
    this._room = rawRoom && redisUtils.parseHash(rawRoom);
    this._field = rawField;
    this._moves = rawMoves;
  }

  serializeSummary() {
    return {
      token: this.token,
      createdAt: this._room.createdAt,
      accepting: this.accepting
    };
  }

  get accepting() {
    return this._room &&
      (!!this._room.player.host && !this._room.player.guest);
  }
};
