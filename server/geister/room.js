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
      name: hostName,
      connection: 1
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

  join(userId, uesrName) {
    const redis = redisClient();

    const ret = this.watch([KeyType.SUMMARY], redis, multi => {
      if (this.isPlayer(userId)) return multi;
      if (!!this.guest) return; // guestが既にいる
      return multi
        .hset(this.summaryKey, 'players:guest:id', userId)
        .hset(this.summaryKey, 'players:guest:name', uesrName)
        .hset(this.summaryKey, 'players:guest:connection', 1);
    });
    return pfinally(ret, ()=> redis.quit());
  }

  connect(userId) {
    const redis = redisClient();

    let userType = null;
    const ret = this.watch([KeyType.SUMMARY], redis, multi => {
      userType = this.userType(userId);
      if (!userType) return;
      return multi.hset(this.summaryKey, `players:${userType}:connection`, 1);
    })
      .then(()=> redis.hgetallAsync(this.summaryKey))
      .then((summary)=> this.summary = summary)
      .then(()=> userType);
    return pfinally(ret, ()=> redis.quit());
  }

  ready(userType, formation) {
    const isValid = formation.reduce((sum, f)=> sum + f, 0) == 4;
    if (!isValid) {
      return Promise.reject();
    }

    const value = JSON.stringify(formation.map(f => f ? 1 : 0));
    const redis = redisClient();

    let firstUser = null;

    const ret = this.watch([KeyType.SUMMARY], redis, multi => {
      if (this.isReady(userType)) return;
      multi = multi.hset(this.summaryKey, `players:${userType}:formation`, value);

      if (this.isReady(inverseUserType(userType))) {
        firstUser = Object.values(UserType)[Math.floor(Math.random() * Object.keys(UserType).length)];
        const host = (this.host.formation ? JSON.parse(this.host.formation) : formation).map(i => i ? CellType.HOST_GOOD : CellType.HOST_BAD);
        const guest = (this.guest.formation ? JSON.parse(this.guest.formation) : formation).map(i => i ? CellType.GUEST_GOOD : CellType.GUEST_BAD);
        const n = CellType.NONE;
        const field = [
          n, ...guest.slice(4, 8).reverse(), n,
          n, ...guest.slice(0, 4).reverse(), n,
          n, n, n, n, n, n,
          n, n, n, n, n, n,
          n, ...host.slice(0, 4), n,
          n, ...host.slice(4, 8), n
        ];
        multi = multi.hset(this.summaryKey, 'turn', firstUser)
          .rpush(this.fieldKey, field);
      }
      return multi;
    }).then(()=> !!firstUser);
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
    let [fromCell, destCell] = [null, null];
    const ret = this.watch([KeyType.SUMMARY, KeyType.FIELD], redis, multi => {
      if (this.won) return;
      if (!this.isTurn(userType)) return;
      fromCell = this.field[pointToIndex(from)];
      destCell = this.field[pointToIndex(dest)];
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

      return {
        [UserType.HOST]: {
          from: fromCell.mask(UserType.HOST),
          dest: destCell
        },
        [UserType.GUEST]: {
          from: fromCell.mask(UserType.GUEST),
          dest: destCell.inverse()
        }
      };
    });
    return pfinally(ret, ()=> redis.quit());
  }

  escape(userType, from) {
    const redis = redisClient();
    let cell = null;
    const ret = this.watch([KeyType.SUMMARY, KeyType.FIELD], redis, multi => {
      if (this.won) return;
      if (!this.isTurn(userType)) return;
      cell = this.field[pointToIndex(from)];
      if (!cell.isEscapable(userType)) return;

      return multi
        .lset(this.fieldKey, cell.toIndex(), cell.escapeType())
        .lrange(this.fieldKey, 0, -1);
    }).then(([, field])=> {
      this.field = field;

      return {
        [UserType.HOST]: {from: cell},
        [UserType.GUEST]: {from: cell.inverse()}
      };
    });
    return pfinally(ret, ()=> redis.quit());
  }

  leave(userType) {
    const redis = redisClient();
    let del = false;
    let ret = this.watch([KeyType.SUMMARY], redis, multi => {
      if (!this.isConnected(userType)) return;
      if (this.isConnected(inverseUserType(userType))) {
        return multi.hset(this.summaryKey, `players:${userType}:connection`, 0);
      }
      del = true;
      return multi;
    }).then(()=> {
      return del && redis.delAsync(this.summaryKey, this.fieldKey, this.movesKey);
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
        .then(replies => replies || (tryCount < 5 ? new Promise(resolve => setTimeout(()=> resolve(proc(tryCount + 1)), Math.floor(Math.random() * 10) * 50)) : Promise.reject('tried 3 times in watch')));
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
    const ret = this.watch([KeyType.SUMMARY], redis, multi => {
      if (this.summary.won) return;
      return multi.hset(this.summaryKey, 'won', this.won);
    }).catch(err => console.log('failed on applyWon'));
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
      won: this.won,
      createdAt: this.summary.createdAt,
      players: {
        host: (h => h && {
          name: h.name,
          connection: h.connection == 1,
          ready: !!h.formation
        })(this.host),
        guest: (g => g && {
          name: g.name,
          connection: g.connection == 1,
          ready: !!g.formation
        })(this.guest)
      }
    };
  }

  serializeField(userType) {
    const filteredField = this.field.map(cell => {
      if (cell.type == CellType.NONE) {
        return cell.type; // no object
      } else if (cell.type[0] == userType[0]) {
        return cell.type[1]; // my object
      } else if (cell.type[1] == '!') {
        return CellType.ENEMY_ESCAPE;
      } else if (this.won) {
        return `${CellType.ENEMY}${cell.type[1]}`; // enemy object if finished
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
      field: this.serializeField(userType),
      userStatus: this.serializeUserStatus(userType)
    });
  }

  serializeUserStatus(userType) {
    const remain = this.calcRemain();
    switch (userType) {
      case UserType.HOST: return {
        rivalRemain: {
          '+': remain[CellType.GUEST_GOOD] + remain[CellType.GUEST_ESCAPE],
          '-': remain[CellType.GUEST_BAD]
        }
      };
      case UserType.GUEST: return {
        rivalRemain: {
          '+': remain[CellType.HOST_GOOD] + remain[CellType.HOST_ESCAPE],
          '-': remain[CellType.HOST_BAD]
        }
      };
    }
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
    const remain = this.calcRemain();
    if (remain[CellType.HOST_ESCAPE]) return UserType.HOST;
    if (!remain[CellType.HOST_GOOD]) return UserType.GUEST;
    if (!remain[CellType.HOST_BAD]) return UserType.HOST;
    if (remain[CellType.GUEST_ESCAPE]) return UserType.GUEST;
    if (!remain[CellType.GUEST_GOOD]) return UserType.HOST;
    if (!remain[CellType.GUEST_BAD]) return UserType.GUEST;
  }

  calcRemain() {
    const remain = {};
    Object.values(CellType).forEach(type => remain[type] = 0);
    this.field.forEach(cell => remain[cell.type] += 1);
    return remain;
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

  userType(id) {
    if (this.isHost(id)) return UserType.HOST;
    if (this.isGuest(id)) return UserType.GUEST;
  }

  isConnected(userType) {
    return this[userType] && this[userType].connection == 1;
  }

  get hasNoConnection() {
    return Object.values(UserType).every(userType => !this.isConnected(userType));
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

  get point() {
    return {x: this.x, y: this.y};
  }

  mask(userType) {
    const point = userType == UserType.GUEST ? symmetryPoint(this.point) : this.point;
    const type = inverseUserType(userType)[0] == this.type[0] ? CellType.ENEMY : this.type;
    return Object.assign({}, this, point, {type});
  }

  inverse() {
    return Object.assign({}, this, symmetryPoint(this.point));
  }
}
