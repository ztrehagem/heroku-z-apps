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

const createInitialSummary = (hostId, hostName)=> ({
  createdAt: new Date().toUTCString(),
  players: {
    host: {
      id: hostId,
      name: hostName
    }
  }
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
      .then(keys => keys.map(key => new Room(keyToToken(key))))
      .then(rooms => rooms.map(room => room.fetchSummary()))
      .then(promises => Promise.all(promises))
      .catch(()=> null);
  }

  static create(hostId, hostName) {
    const room = new Room(UUID());
    const summary = createInitialSummary(hostId, hostName);
    const values = utils.joinArray(utils.objectToArray(redisUtils.buildHash(summary)));

    return room.update(m => m.hmset(room.summaryKey, values))
      .then(()=> room.summary = summary)
      .then(()=> room);
  }

  static join(token, guestId, guestName) {
    const room = new Room(token);

    return room.fetchSummary()
      .then(()=> !room.isHost(guestId) ? Promise.resolve() : Promise.reject())
      .then(()=> room.update(m =>
        m.hsetnx(room.summaryKey, 'players:guest:id', guestId)
        .hsetnx(room.summaryKey, 'players:guest:name', guestName))
      )
      .then(([result]) => (result == 1) ? Promise.resolve() : Promise.reject());
  }

  constructor(token) {
    this._token = token;
  }

  get token() {
    return this._token;
  }

  get summary() {
    return this._summary;
  }

  set summary(rawSummary) {
    this._summary = redisUtils.parseHash(rawSummary);
  }

  get summaryKey() {
    return KEY_SUMMARY(this.token);
  }

  get fieldKey() {
    return KEY_FIELD(this.token);
  }

  get movesKey() {
    return KEY_MOVES(this.token);
  }

  fetchSummary() {
    return redis.hgetallAsync(this.summaryKey)
      .then(summary => this.summary = summary)
      .then(()=> this);
  }

  fetchField() {
    return redis.lrangeAsync(this.fieldKey, 0, -1)
      .then(field => this.field = field)
      .then(()=> this);
  }

  update(fn) {
    return fn(redis.multi())
      .expire(this.summaryKey, EXPIRE)
      .expire(this.fieldKey, EXPIRE)
      .expire(this.movesKey, EXPIRE)
      .execAsync();
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
    const hashKey = `players:${userType}:formation`;
    return this.update(m => m.hset(this.summaryKey, hashKey, formationStr));
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
    const firstUser = Object.values(UserType)[Math.floor(Math.random() * 2)];
    return this.update(m =>
      m.hset(this.summaryKey, 'turn', firstUser)
      .rpush(this.fieldKey, field)
    );
  }
};
