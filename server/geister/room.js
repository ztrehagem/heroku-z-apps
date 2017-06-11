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
const CellType = {
  HOST_GOOD: 'h+',
  HOST_BAD: 'h-',
  HOST_ESCAPE: 'h!',
  GUEST_GOOD: 'g+',
  GUEST_BAD: 'g-',
  GUEST_ESCAPE: 'g!',
  NONE: '0',
  ENEMY: 'e',
  ENEMY_ESCAPE: 'e!'
};
const KEY_PREFIX = 'geister';
const EXPIRE = '' + (60 * 20); // 20 minutes

const makeKey = (keyType, token)=> [KEY_PREFIX, keyType, token].join(':');
const keyToToken = (keyType, key)=> key.match(new RegExp('^' + makeKey(keyType, '(.*)') + '$'))[1];
const pointToIndex = ({x, y})=> y * 6 + x;
const symmetryPoint = ({x, y})=> ({x: 5 - x, y: 5 - y});
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

const pfinally = (promise, fn)=> {
  return promise.then(result => {
    fn();
    return result;
  }).catch(err => {
    fn();
    return Promise.reject(err);
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

  static inverseUserType(userType) {
    return inverseUserType(userType);
  }

  constructor(token) {
    this.token = token;
  }

  static index() {
    const redis = redisClient();
    const keyPattern = makeKey(KeyType.SUMMARY, '*');

    const ret = redis.keysAsync(keyPattern)
      .then(keys => keys.map(key => keyToToken(KeyType.SUMMARY, key)))
      .then(tokens => tokens.map(token => new Room(token)))
      .then(rooms => rooms.map(room =>
        room.fetch([KeyType.SUMMARY], redis)
          .then(()=> room)
          .catch(()=> null)
      ))
      .then(promises => Promise.all(promises))
      .then(rooms => rooms.filter(room => !!room));
    return pfinally(ret, ()=> redis.quit());
  }

  static create(hostId, hostName) {
    const room = new Room(UUID());
    const redis = redisClient();
    const summary = createInitialSummary(hostId, hostName);
    const values = utils.joinArray(utils.objectToArray(redisUtils.buildHash(summary)));

    const queue = redis.multi().hmset(room.summaryKey, values);
    const ret = room.appendExpire(queue).execAsync()
      .then(()=> room.summary = summary)
      .then(()=> room);
    return pfinally(ret, ()=> redis.quit());
  }

  join(guestId, guestName) {
    const redis = redisClient();

    const ret = this.watch([KeyType.SUMMARY], redis, multi => {
      if (this.isHost(guestId)) return; // 自分がホストなのにguestとしてjoinしようとした
      if (!!this.guest) return; // guestが既にいる
      return multi
        .hset(this.summaryKey, 'players:guest:id', guestId)
        .hset(this.summaryKey, 'players:guest:name', guestName);
    });
    return pfinally(ret, ()=> redis.quit());
  }

  ready(userType, formation) {
    const isValid = formation.reduce((sum, f)=> sum + f, 0) == 4;
    if (!isValid) {
      return Promise.reject();
    }

    const value = JSON.stringify(formation.map(f => f ? 1 : 0));
    const redis = redisClient();

    const ret = this.watch([KeyType.SUMMARY], redis, multi => {
      if (this.isReady(userType)) return;
      return multi.hset(this.summaryKey, `players:${userType}:formation`, value);
    });
    return pfinally(ret, ()=> redis.quit());
  }

  play() {
    const redis = redisClient();
    const firstUser = Object.values(UserType)[Math.floor(Math.random() * 2)];
    const ret = this.watch([KeyType.SUMMARY], redis, multi => {
      if (!this.isPlayable) return;
      const host = JSON.parse(this.host.formation).map(i => i ? CellType.HOST_GOOD : CellType.HOST_BAD);
      const guest = JSON.parse(this.guest.formation).map(i => i ? CellType.GUEST_GOOD : CellType.GUEST_BAD);
      const field = [
        0, ...guest.slice(4, 8).reverse(), 0,
        0, ...guest.slice(0, 4).reverse(), 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, ...host.slice(0, 4), 0,
        0, ...host.slice(4, 8), 0
      ];
      return multi.hset(this.summaryKey, 'turn', firstUser)
        .rpush(this.fieldKey, field);
    }).then(()=> firstUser);
    return pfinally(ret, ()=> redis.quit());
  }

  action(userType, from, dest) { // contains escape
    if (userType == UserType.GUEST) {
      from = symmetryPoint(from);
      dest = dest && symmetryPoint(dest);
    }

    return dest ? this.move(userType, from, dest) : this.escape(userType, from);
  }

  move(userType, from, dest) {
    const redis = redisClient();
    const ret = this.watch([KeyType.SUMMARY, KeyType.FIELD], redis, multi => {
      if (this.won) return;
      if (!this.isTurn(userType)) return;
      const fromCell = this.field[pointToIndex(from)];
      const destCell = this.field[pointToIndex(dest)];
      if (!fromCell.isMovableTo(destCell, userType)) return;

      return multi
        .lset(this.fieldKey, fromCell.toIndex(), CellType.NONE)
        .lset(this.fieldKey, destCell.toIndex(), fromCell.type)
        .hset(this.summaryKey, 'turn', inverseUserType(userType))
        .lrange(this.fieldKey, 0, -1)
        .hgetall(this.summaryKey);
    }).then(([,,, field, summary])=> {
      this.field = field;
      this.summary = summary;
    });
    return pfinally(ret, ()=> redis.quit());
  }

  escape(userType, from) {
    const redis = redisClient();
    const ret = this.watch([KeyType.SUMMARY, KeyType.FIELD], redis, multi => {
      if (this.won) return;
      if (!this.isTurn(userType)) return;
      const cell = this.field[pointToIndex(from)];
      if (!cell.isEscapable(userType)) return;

      return multi
        .lset(this.fieldKey, cell.toIndex(), cell.escapeType())
        .lrange(this.fieldKey, 0, -1);
    }).then(([, field])=> {
      this.field = field;
    });
    return pfinally(ret, ()=> redis.quit());
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
        .then(replies => replies || (tryCount < 3 ? proc(tryCount + 1) : Promise.reject('tried 3 times in watch')));
    };

    return proc(1);
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
    return pfinally(Promise.all(promises), ()=> redisArg || redis.quit());
  }

  applyWon() {
    const redis = redisClient();
    const ret = this.watch([KeyType.SUMMARY], redis, multi =>
      multi.hset(this.summaryKey, 'won', this.won)
    );
    return pfinally(ret, ()=> redis.quit());
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
    const filteredField = this.field.map(cell => {
      if (cell.type == CellType.NONE) {
        return null; // no object
      } else if (cell.type[0] == userType[0]) {
        return cell.type[1]; // my object
      } else if (cell.type[1] == '!') {
        return CellType.ENEMY_ESCAPE;
      } else {
        return CellType.ENEMY; // enemy object
      }
    });
    return (userType == UserType.GUEST ? filteredField.reverse() : filteredField);
  }

  serializePlayingInfo(userType) {
    // return Object.assign(this.serializeSummary(), {
    return ({
      won: this.won,
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

  get field() {
    return this._field;
  }

  set field(rawField) {
    this._field = rawField.map((raw, index) => new Cell(raw, index));
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
    if (this.won) return 'finished'; // ゲーム終了
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

  get won() {
    if (this.summary && this.summary.won) {
      return this.summary.won;
    }
    if (!this.field) return;
    const remain = {};
    Object.values(CellType).forEach(type => remain[type] = 0);
    this.field.forEach(cell => remain[cell.type] += 1);
    let won = null;
    if (remain[CellType.HOST_ESCAPE]) won = UserType.HOST;
    if (!remain[CellType.HOST_GOOD]) won = UserType.GUEST;
    if (!remain[CellType.HOST_BAD]) won = UserType.HOST;
    if (remain[CellType.GUEST_ESCAPE]) won = UserType.GUEST;
    if (!remain[CellType.GUEST_GOOD]) won = UserType.HOST;
    if (!remain[CellType.GUEST_BAD]) won = UserType.GUSET;
    if (won) {
      this.applyWon();
    }
    return won;
  }

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

class Cell {
  constructor(type, index) {
    this.type = type;
    this.x = index % 6;
    this.y = Math.floor(index / 6);
  }

  isMine(userType) {
    return this.type[0] == userType[0];
  }

  isGood() {
    return this.type == CellType.HOST_GOOD || this.type == CellType.GUEST_GOOD;
  }

  isNextTo(cell) {
    return Math.abs(cell.x - this.x) + Math.abs(cell.y - this.y) == 1;
  }

  isFurtherCorner(userType) {
    switch (userType) {
      case UserType.HOST: return this.y === 0 && (this.x === 0 || this.x === 5);
      case UserType.GUEST: return this.y === 5 && (this.x === 0 || this.x === 5);
    }
  }

  isMovableTo(cell, userType) {
    return !cell.isMine(userType) && this.isNextTo(cell);
  }

  isEscapable(userType) {
    return this.isMine(userType) && this.isGood() && this.isFurtherCorner(userType);
  }

  toIndex() {
    return this.x + this.y * 6;
  }

  escapeType() {
    switch (this.type) {
      case CellType.HOST_GOOD: return CellType.HOST_ESCAPE;
      case CellType.GUEST_GOOD: return CellType.GUEST_ESCAPE;
    }
  }
}
