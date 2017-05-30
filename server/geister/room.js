const redis = require('server/redis');
const utils = require('utils');
const redisUtils = require('utils/redis');
const UUID = require('uuid/v4');

const EXPIRE = '' + (60 * 20); // 20 minutes
const KEY_PREFIX = 'geister';
const KEY_SUMMARY = token => `${KEY_PREFIX}:summary:${token}`;
const KEY_FIELD = token => `${KEY_PREFIX}:field:${token}`;
const KEY_MOVES = token => `${KEY_PREFIX}:moves:${token}`;

const UserType = {HOST: 'host', GUEST: 'guest'};

const execAsyncTtl = (token, fn)=>
  fn(redis.multi())
  .expire(KEY_SUMMARY(token), EXPIRE)
  .expire(KEY_MOVES(token), EXPIRE)
  .expire(KEY_FIELD(token), EXPIRE)
  .execAsync();

const initSummary = (id, name)=> redisUtils.buildHash({
  createdAt: new Date().toUTCString(),
  players: {host: {id, name}}
});

module.exports = class Room {
  static get UserType() {
    return UserType;
  }

  static index() {
    const keyPattern = KEY_SUMMARY('*');
    const regexp = new RegExp(`^${KEY_SUMMARY('(.*)')}$`);
    const keyToToken = key => key.match(regexp)[1];

    return redis.keysAsync(keyPattern)
      .then(keys => Promise.all(keys.map(key =>
        redis.hgetallAsync(key)
          .then(summary => new Room(keyToToken(key), summary))
      )))
      .catch(()=> null);
  }

  static getAll(token) {
    const sKey = KEY_SUMMARY(token);
    const fKey = KEY_FIELD(token);
    const mKey = KEY_MOVES(token);

    return execAsyncTtl(token, m => m.hgetall(sKey).lrange(fKey, 0, -1).lrange(mKey, 0, -1))
      .then(([summary, field, moves]) => new Room(token, summary, field, moves));
  }

  static getSummary(token) {
    const key = KEY_SUMMARY(token);

    return execAsyncTtl(token, m => m.hgetall(key))
      .then(([summary]) => new Room(token, summary));
  }

  static getField(token) {
    const key = KEY_FIELD(token);

    return execAsyncTtl(token, m => m.lrange(key, 0, -1))
      .then(([field]) => new Room(token, null, field));
  }

  static create(hostId, hostName) {
    const token = UUID();
    const rawSummary = initSummary(hostId, hostName);
    const values = utils.joinArray(utils.objectToArray(rawSummary));
    const key = KEY_SUMMARY(token);

    return execAsyncTtl(token, m => m.hmset(key, values))
      .then(()=> new Room(token, rawSummary));
  }

  static join(token, guestId, guestName) {
    const key = KEY_SUMMARY(token);

    return redis.hgetAsync(key, 'players:host:id')
      .then(hostId => (hostId != guestId) ? Promise.resolve() : Promise.reject())
      .then(()=> execAsyncTtl(token, m => m.hsetnx(key, 'players:guest:id', guestId).hsetnx(key, 'players:guest:name', guestName)))
      .then(([result]) => (result == 1) ? Promise.resolve() : Promise.reject());
  }

  constructor(token, rawSummary, rawField, rawMoves) {
    this.token = token;
    this.summary = rawSummary && redisUtils.parseHash(rawSummary);
    this.field = rawField;
    this.moves = rawMoves;
  }

  updateSummary() {
    return Room.getSummary(this.token)
      .then(room => this.summary = room.summary);
  }

  updateField() {
    return Room.getField(this.token)
      .then(room => this.field = room.field);
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
      turn: this.turn,
      field: this.serializeField(userType)
    });
  }

  serializeField(userType) {
    return this.field.map(typeStr => {
      if (typeStr == '0') {
        return null; // no object
      } else if (typeStr[0] == userType[0]) {
        return typeStr[1]; // my object
      } else {
        return 'e'; // enemy object
      }
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
    return !!this.turn;
  }

  get turn() {
    return this.summary.turn;
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
    const mappedFormation = formation.map(f => f ? 1 : 0);
    const formationStr = `[${mappedFormation.join(',')}]`;
    const key = KEY_SUMMARY(this.token);
    const hashKey = `players:${userType}:formation`;
    return execAsyncTtl(this.token, m => m.hset(key, hashKey, formationStr));
  }

  play() {
    if (!this.isPlayable) {
      return Promise.reject();
    }
    const host = JSON.parse(this.host.formation).map(i => i ? 'h+' : 'h-');
    const guest = JSON.parse(this.guest.formation).map(i => i ? 'g+' : 'g-');
    const field = [
      0, ...guest.slice(4, 8).reverse(), 0,
      0, ...guest.slice(0, 4).reverse(), 0,
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
      0, ...host.slice(0, 4), 0,
      0, ...host.slice(4, 8), 0
    ];
    const sKey = KEY_SUMMARY(this.token);
    const fKey = KEY_FIELD(this.token);
    const firstUser = Object.values(UserType)[Math.floor(Math.random() * 2)];
    return execAsyncTtl(this.token, m => m.hset(sKey, 'turn', firstUser).rpush(fKey, field));
  }
};
