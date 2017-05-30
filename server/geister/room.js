const redis = require('server/redis');
const utils = require('utils');
const redisUtils = require('utils/redis');
const UUID = require('uuid/v4');

const KEY_PREFIX = 'geister';
const CREATED_AT = 'createdAt';
const EXPIRE = '' + (60 * 20); // 20 minutes
const KEY_SUMMARY = token => `${KEY_PREFIX}:summary:${token}`;
const KEY_FIELD = token => `${KEY_PREFIX}:field:${token}`;
const KEY_MOVES = token => `${KEY_PREFIX}:moves:${token}`;

const execAsyncTouch = (token, fn)=>
  fn(redis.multi())
  .expire(KEY_SUMMARY(token), EXPIRE)
  .expire(KEY_MOVES(token), EXPIRE)
  .expire(KEY_FIELD(token), EXPIRE)
  .execAsync();

module.exports = class Room {
  static index() {
    return redis.keysAsync(KEY_SUMMARY('*'))
      .then(keys => Promise.all(keys.map(key => redis.hgetallAsync(key).then(reply => ({
        token: new RegExp(`^${KEY_SUMMARY('(.*)')}$`).exec(key)[1],
        raw: reply
      })))))
      .then(results => results.map(r => new Room(r.token, r.raw)))
      .catch(err => null);
  }

  static getFull(token) {
    const rkey = KEY_SUMMARY(token);
    const fkey = KEY_FIELD(token);
    const mkey = KEY_MOVES(token);
    return execAsyncTouch(token, m => m.hgetall(rkey).lrange(fkey, 0, -1).lrange(mkey, 0, -1))
      .then((replies) => new Room(token, replies[0], replies[1], replies[2]));
  }

  static getSummary(token) {
    const key = KEY_SUMMARY(token);
    return execAsyncTouch(token, m => m.hgetall(key))
      .then(replies => new Room(token, replies[0]));
  }

  static getField(token) {
    const key = KEY_FIELD(token);
    return execAsyncTouch(token, m => m.lrange(key, 0, -1))
      .then(replies => new Room(token, null, replies[0]));
  }

  static getDetails(token) {
    const fkey = KEY_FIELD(token);
    const mkey = KEY_MOVES(token);
    return execAsyncTouch(token, m => m.lrange(fkey, 0, -1).lrange(mkey, 0, -1))
      .then(replies => new Room(token, null, replies[0], replies[1]));
  }

  static create(hostId, hostName) {
    const token = UUID();
    const rawRoom = redisUtils.buildHash({
      [CREATED_AT]: new Date().toUTCString(),
      players: {
        host: {id: hostId, name: hostName}
      }
    });
    const values = utils.joinArray(utils.objectToArray(rawRoom));
    const key = KEY_SUMMARY(token);

    return execAsyncTouch(token, m => m.hmset(key, values))
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
    const key = KEY_SUMMARY(token);
    return redis.hgetAsync(key, 'players:host:id')
      .then(reply => (reply != guestId) ? Promise.resolve() : Promise.reject())
      .then(()=> execAsyncTouch(token, m => m.hsetnx(key, 'players:guest:id', guestId).hsetnx(key, 'players:guest:name', guestName)))
      .then(replies => (replies[0] == 1) ? Promise.resolve() : Promise.reject());
  }

  constructor(token, rawRoom, rawField, rawMoves) {
    this.token = token;
    this.summary = rawRoom && redisUtils.parseHash(rawRoom);
    this.field = rawField;
    this.moves = rawMoves;
  }

  updateSummary() {
    return Room.getSummary(this.token).then(room => Object.assign(this, {summary: room.summary}));
  }

  updateField() {
    return Room.getField(this.token).then(room => Object.assign(this, {field: room.field}));
  }

  serializeSummary() {
    return {
      token: this.token,
      status: this.status,
      createdAt: this.summary.createdAt,
      players: {
        host: (h => h && {
          name: h.name,
          ready: !!h.formation
        })(this.host),
        guest: (g => g && {
          name: g.name,
          ready: !!g.formation
        })(this.guest)
      }
    };
  }

  serializeForPlayer(userType) {
    return Object.assign(this.serializeSummary(), {
      turn: this.first,
      field: this.serializeField(userType)
    });
  }

  serializeField(userType) {
    return this.field.map(f => f.startsWith(userType[0]) ? f : f.substr(0, 1));
  }

  get status() {
    if (this.playing) return 'playing'; // ゲーム進行中
    if (!this.accepting) return 'ready'; // 準備中
    return 'accepting'; // 参加受付中
  }

  get accepting() {
    return this.summary && this.summary.players &&
      (!!this.summary.players.host && !this.summary.players.guest);
  }

  get playing() {
    // return this.isHostReady && this.isGuestReady;
    return !!this.first;
  }

  get first() {
    return this.summary.first;
  }

  get host() {
    return this.summary && this.summary.players.host;
  }

  get guest() {
    return this.summary && this.summary.players.guest;
  }

  isHost(id) {
    return this.host && this.host.id == id;
  }

  isGuest(id) {
    return this.guest && this.guest.id == id;
  }

  isPlayer(id) {
    return this.isHost(id) || this.isGuest(id);
  }

  get isHostReady() {
    return this.host && !!this.host.formation;
  }

  get isGuestReady() {
    return this.guest && !!this.guest.formation;
  }

  get isPlayable() {
    return this.isHostReady && this.isGuestReady;
  }

  ready(userType, formation) {
    if (!['guest', 'host'].includes(userType)) {
      return Promise.reject();
    }
    return execAsyncTouch(this.token, m =>
      m.hset(KEY_SUMMARY(this.token), `players:${userType}:formation`, `[${formation.join(',')}]`)
    );
  }

  play() {
    if (!this.isPlayable) {
      return Promise.reject();
    }
    const host = JSON.parse(this.host.formation).map(i => i ? 'h+' : 'h-');
    const guest = JSON.parse(this.guest.formation).map(i => i ? 'g+' : 'g+');
    const fields = [
      // TODO h+とかにする
      [0, ...guest.slice(4, 8).reverse(), 0],
      [0, ...guest.slice(0, 4).reverse(), 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, ...host.slice(0, 4), 0],
      [0, ...host.slice(4, 8), 0]
    ];
    return execAsyncTouch(this.token, m =>
      m.hset(KEY_SUMMARY(this.token), `first`, ['host','guest'][Math.floor(Math.random() * 2)])
      .rpush(KEY_FIELD(this.token), utils.joinArray(fields))
    );
  }
};
