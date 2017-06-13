app.component('roomPlayfield', {
  templateUrl: asset.template('room-playfield'),
  require: {
    roomCtrl: '^room'
  },
  controller() {
    'ngInject';

    this.$onInit = ()=> {
      this.turn = this.roomCtrl.firstUser;
      this.field = null;
      this.selected = null;

      this.roomCtrl.socket.emit('get-playing-info', null, info => {
        this.setPlayingInfo(info);
      });

      this.roomCtrl.socket.on('rival-acted', ({result, info})=> {
        console.log('rival-acted', result, info);
        this.result = result;
        this.setPlayingInfo(info);
      });

    };

    this.setPlayingInfo = ({won, turn, field, userStatus})=> {
      this.roomCtrl.won = won;
      this.turn = turn;
      this.setField(field);
      this.userStatus = userStatus;
    };

    this.setField = (rawField)=> {
      this.field = rawField.reduce((field, raw, index)=> {
        const {x, y} = indexToVector(index);
        if (!field[y]) field[y] = [];
        field[y][x] = new Cell(raw, x, y);
        return field;
      }, []);
    };

    this.onClickCell = (cell)=> {
      if (this.roomCtrl.won) return;

      if (this.selected) {
        if (this.selected.isMovableTo(cell)) {
          doMove(cell);
        } else {
          unselect();
        }
      } else {
        if (cell.isMine()) {
          select(cell);
        }
      }
    };

    this.onClickEscape = ()=> {
      if (this.roomCtrl.won) return;

      if (this.selected && this.selected.isEscapable()) {
        doMove();
      }
    };

    const select = (cell)=> {
      this.selected = cell;
      this.emitting = null;
    };

    const unselect = ()=> {
      this.selected = null;
    };

    const doMove = (cell)=> {
      console.log(`emit ${cell ? 'move' : 'escape'}`);

      this.emitting = this.roomCtrl.socket.emitAsync('action', {
        from: this.selected.toPoint(),
        dest: cell && cell.toPoint()
      }).then(([{result, info}, cbAsync])=> {
        this.result = result;
        this.setPlayingInfo(info);
      }).catch(()=> {
        console.log(`failed ${cell ? 'move' : 'escape'}`);
      }).finally(()=> {
        unselect();
      });
    };

    class Cell {
      constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
      }
      isGood() {
        return this.type[0] == '+';
      }
      isBad() {
        return this.type[0] == '-';
      }
      isMine() {
        return this.isGood() || this.isBad();
      }
      isNextTo(cell) {
        return Math.abs(cell.x - this.x) + Math.abs(cell.y - this.y) == 1;
      }
      isMovableTo(cell) {
        return !cell.isMine() && this.isNextTo(cell);
      }
      isEscapable() {
        return this.isMine() && this.isCorner();
      }
      isCorner() {
        return this.y === 0 && (this.x === 0 || this.x === 5);
      }
      toPoint() {
        return {x: this.x, y: this.y};
      }
    }

    const indexToVector = (index)=> ({x: index % 6, y: Math.floor(index / 6)});
  }
});
