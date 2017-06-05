const redisClient = require('server/redis-client');
const utils = require('utils');
const redisUtils = require('utils/redis');
const UUID = require('uuid/v4');

const KeyType = {
  SUMMARY: 'summary',
  FIELD: 'field',
  MOVES: 'moves'
};
const UserType = {
  HOST: 'host',
  GUEST: 'guest'
};
const KEY_PREFIX = 'geister';
const EXPIRE = '' + (60 * 20); // 20 minutes

const makeKey = (keyType, token)=> [KEY_PREFIX, keyType, token].join(':');
const keyToToken = (keyType, key)=> key.match(new RegExp('^' + makeKey(keyType, '(.*)') + '$'))[1];
const pointToIndex = ({x, y})=> y * 6 + x;
const symmetryPoint = ({x, y})=> ({x: 6 - x, y: 6 - y});
const inverseUserType = userType => {
  switch (userType) {
    case UserType.HOST: return UserType.GUEST;
    case UserType.GUEST: return UserType.HOST;
  }
};
const createInitialSummary = (hostId, hostName)=> ({
  createdAt: new Date().toUTCString(),
  players: {
    host: {
      id: hostId,
      name: hostName
    }
  }
});

const awaitAndQuit = (promise, redis)=> {
  if (!redis) return promise;
  return promise.then(result => {
    redis.quit();
    return result;
  }).catch(err => {
    redis.quit();
    return err;
  });
};

module.exports = class Room {
  // -- public

  static get UserType() {
    return UserType;
  }

  static get KeyType() {
    return KeyType;
  }

  constructor(token) {
    this.token = token;
  }

  static index() {
    const redis = redisClient();
    const keyPattern = makeKey(KeyType.SUMMARY, '*');

    return redis.keysAsync(keyPattern)
      .then(keys => keys.map(key => keyToToken(KeyType.SUMMARY, key)))
      .then(tokens => tokens.map(token => new Room(token)))
      .then(rooms => rooms.map(room =>
        room.fetch([KeyType.SUMMARY], redis)
          .then(()=> room)
          .catch(()=> null)
      ))
      .then(promises => Promise.all(promises))
      .then(rooms => rooms.filter(room => !!room))
      .catch(()=> null)
      .then(result => {
        redis.quit();
        return result;
      });
  }

  static create(hostId, hostName) {
    const room = new Room(UUID());
    const redis = redisClient();
    const summary = createInitialSummary(hostId, hostName);
    const values = utils.joinArray(utils.objectToArray(redisUtils.buildHash(summary)));

    const queue = redis.multi().hmset(room.summaryKey, values);
    return room.appendExpire(queue).execAsync()
      .then(()=> room.summary = summary)
      .then(()=> room)
      .catch(()=> null)
      .then(result => {
        redis.quit();
        return result;
      });
  }

  static join(token, guestId, guestName) {
    const room = new Room(token);
    const redis = redisClient();

    return room.watch([KeyType.SUMMARY], redis, multi => {
      if (room.isHost(guestId)) return; // 自分がホストなのにguestとしてjoinしようとした
      if (!!room.guest) return; // guestが既にいる
      return multi.hset(room.summaryKey, 'players:guest:id', guestId)
        .hset(room.summaryKey, 'players:guest:name', guestName);
    }).then(replies => {
      redis.quit();
      return !!replies;
    });
  }

  ready(userType, formation) {
    const isValid = formation.reduce((sum, f)=> sum + f, 0) == 4;
    if (!isValid) {
      return Promise.reject();
    }

    const value = JSON.stringify(formation.map(f => f ? 1 : 0));
    const redis = redisClient();

    return this.watch([KeyType.SUMMARY], redis, multi => {
      if (this.isReady(userType)) return;
      return multi.hset(this.summaryKey, `players:${userType}:formation`, value);
    }).then(replies => {
      redis.quit();
      return replies || Promise.reject('cant ready');
    });
  }

  play() {
    const redis = redisClient();
    return this.watch([KeyType.SUMMARY], redis, multi => {
      if (!this.isPlayable) return;
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
      return multi.hset(this.summaryKey, 'turn', firstUser)
        .rpush(this.fieldKey, field);
    }).then(replies => {
      redis.quit();
      return replies || Promise.reject('cant play');
    });
  }

  move() { // contains escape

  }

  // -- private

  watch(keyTypes, redis, multiFn, setExpire = true) {
    const keys = keyTypes.map(keyType => makeKey(keyType, this.token));

    const proc = (tryCount)=> {
      console.log('try', tryCount);
      return redis.watchAsync(keys)
        .then(()=> this.fetch(keyTypes, redis))
        .then(()=> multiFn(redis.multi()))
        .then(queue => (queue && setExpire) ? this.appendExpire(queue) : queue)
        .then(queue => queue ? queue.execAsync() : Promise.reject())
        .then(replies => {
          console.log('replies', replies);
          return replies;
        });
        // .then(replies => replies || (tryCount < 3 ? proc(tryCount + 1) : Promise.reject()));
    };

    return proc(1).catch(()=> null); // eventually returns Array or null
  }

  fetch(keyTypes, redisArg) {
    const redis = redisArg || redisClient();
    const promises = [];
    if (keyTypes.includes(KeyType.SUMMARY))
      promises.push(redis.hgetallAsync(this.summaryKey).then(reply => this.summary = reply));
    if (keyTypes.includes(KeyType.FIELD))
      promises.push(redis.lrangeAsync(this.fieldKey, 0, -1).then(reply => this.field = reply));
    if (keyTypes.includes(KeyType.MOVES))
      promises.push(redis.lrangeAsync(this.movesKey, 0, -1).then(reply => this.moves = reply));
    return awaitAndQuit(Promise.all(promises), redisArg ? null : redis);
  }

  appendExpire(queue) {
    return queue.expire(this.summaryKey, EXPIRE)
      .expire(this.fieldKey, EXPIRE)
      .expire(this.movesKey, EXPIRE);
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

  serializeField(userType) {
    return (userType == UserType.GUEST ? this.field.reverse() : this.field).map(typeStr => {
      if (typeStr == '0') {
        return null; // no object
      } else if (typeStr[0] == userType[0]) {
        return typeStr[1]; // my object
      } else {
        return 'e'; // enemy object
      }
    });
  }

  serializePlayingInfo(userType) {
    // return Object.assign(this.serializeSummary(), {
    return ({
      turn: this.turn,
      field: this.serializeField(userType)
    });
  }

  get summary() {
    return this._summary;
  }

  set summary(rawSummary) {
    this._summary = redisUtils.parseHash(rawSummary);
  }

  get summaryKey() {
    return makeKey(KeyType.SUMMARY, this.token);
  }

  get fieldKey() {
    return makeKey(KeyType.FIELD, this.token);
  }

  get movesKey() {
    return makeKey(KeyType.MOVES, this.token);
  }

  // -- public

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

  // get won() {
  //   return this.summary.won;
  // }

  get turn() {
    return this.summary.turn;
  }

  isTurn(userType) {
    return this.turn == userType;
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

  isReady(userType) {
    return this[userType] && !!this[userType].formation;
  }

  get isHostReady() {
    return this.isReady(UserType.HOST);
  }

  get isGuestReady() {
    return this.isReady(UserType.GUEST);
  }

  get isPlayable() {
    return this.isHostReady && this.isGuestReady;
  }

};
