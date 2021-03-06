app.component('roomPlayfield', {
  templateUrl: asset.template('room-playfield'),
  require: {
    roomCtrl: '^room'
  },
  controller() {
    'ngInject';

    this.$onInit = ()=> {
      this.roomCtrl.turn = null;
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

    this.times = (num)=> num ? [...this.times(num - 1), num] : [];

    this.setPlayingInfo = ({won, turn, field, userStatus})=> {
      this.roomCtrl.won = won;
      this.roomCtrl.turn = turn;
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
        } else if (cell.isMine()) {
          select(cell);
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

    this.tdClass = (cell)=> ({
      selected: cell == this.selected,
      from: this.result && cell.isAt(this.result.from),
      dest: this.result && cell.isAt(this.result.dest),
      e: cell.isEnemy()
    });

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
        console.log('emitted', result, info);
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
      isEnemy() {
        return this.type[0] == 'e';
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
      isAt(target) {
        return target && this.x == target.x && this.y == target.y;
      }
      isNone() {
        return this.type == '0';
      }
      faClass() {
        switch (this.type) {
          case '+' :
          case 'e+': return 'fa-plus-circle';
          case '-' :
          case 'e-': return 'fa-minus-circle';
          case '!' : return 'fa-check-circle';
          case 'e' : return 'fa-circle-o';
          case 'e!': return 'fa-check-circle-o';
        }
      }
    }

    const indexToVector = (index)=> ({x: index % 6, y: Math.floor(index / 6)});
  }
});
