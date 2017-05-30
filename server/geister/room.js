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

const UserType = {HOST: 'host', GUEST: 'guest'};

const execAsyncTouch = (token, fn)=>
  fn(redis.multi())
  .expire(KEY_SUMMARY(token), EXPIRE)
  .expire(KEY_MOVES(token), EXPIRE)
  .expire(KEY_FIELD(token), EXPIRE)
  .execAsync();

module.exports = class Room {
  static get UserType() { return UserType; }

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
      .then(([summary, field, moves]) => new Room(token, summary, field, moves));
  }

  static getSummary(token) {
    const key = KEY_SUMMARY(token);
    return execAsyncTouch(token, m => m.hgetall(key))
      .then(([summary]) => new Room(token, summary));
  }

  static getField(token) {
    const key = KEY_FIELD(token);
    return execAsyncTouch(token, m => m.lrange(key, 0, -1))
      .then(([field]) => new Room(token, null, field));
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
      .then(replies => new Room(token, rawRoom))
      .catch(err => null);
  }

  static join(token, guestId, guestName) {
    const key = KEY_SUMMARY(token);
    return redis.hgetAsync(key, 'players:host:id')
      .then(hostId => (hostId != guestId) ? Promise.resolve() : Promise.reject())
      .then(()=> execAsyncTouch(token, m => m.hsetnx(key, 'players:guest:id', guestId).hsetnx(key, 'players:guest:name', guestName)))
      .then(([result]) => (result == 1) ? Promise.resolve() : Promise.reject());
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
    return this.field.map(f => {
      if (f == '0') return null; // no object
      else if (!f.startsWith(userType[0])) return 'e'; // enemy object
      return f[1]; // my object
    });
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
    if (!Object.values(UserType).includes(userType)) {
      return Promise.reject();
    }
    const isValid = formation.reduce((sum, f)=> sum + f, 0) == 4;
    if (!isValid) {
      return Promise.reject();
    }
    const formationStr = `[${formation.map(f => f ? 1 : 0).join(',')}]`;
    return execAsyncTouch(this.token, m =>
      m.hset(KEY_SUMMARY(this.token), `players:${userType}:formation`, formationStr)
    );
  }

  play() {
    if (!this.isPlayable) {
      return Promise.reject();
    }
    const host = JSON.parse(this.host.formation).map(i => i ? 'h+' : 'h-');
    const guest = JSON.parse(this.guest.formation).map(i => i ? 'g+' : 'g-');
    const fields = [
      [0, ...guest.slice(4, 8).reverse(), 0],
      [0, ...guest.slice(0, 4).reverse(), 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, ...host.slice(0, 4), 0],
      [0, ...host.slice(4, 8), 0]
    ];
    return execAsyncTouch(this.token, m =>
      m.hset(KEY_SUMMARY(this.token), 'first', Object.values(UserType)[Math.floor(Math.random() * 2)])
      .rpush(KEY_FIELD(this.token), utils.joinArray(fields))
    );
  }
};
