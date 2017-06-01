app.component('roomPlayfield', {
  templateUrl: asset.template('room-playfield'),
  require: {
    roomCtrl: '^room'
  },
  controller() {
    'ngInject';

    this.$onInit = ()=> {
      this.turn = null;
      this.field = null;
      this.selected = null;

      this.roomCtrl.socket.emit('get-playing-info', null, ({turn, field}) => {
        this.field = field.reduce((result, raw, index)=> {
          const {x, y} = indexToVector(index);
          if (!result[y]) result[y] = [];
          result[y][x] = new Cell(raw, x, y);
          return result;
        }, []);
        this.turn = turn;
      });
    };

    this.onClickCell = (cell)=> {
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
      if (this.selected && this.selected.isEscapable()) {
        doEscape();
      }
    };

    const select = (cell)=> {
      this.selected = cell;
      this.emitting = null;
      console.log('selected', cell);
    };

    const unselect = ()=> {
      console.log('unselect');
      this.selected = null;
    };

    const doMove = (cell)=> {
      console.log('emit move', this.selected, cell);
      unselect();
      // this.emitting = this.roomCtrl.socket.emitAsync('move', {
      //   from: {x: this.selected.x, y: this.selected.y},
      //   to: {x: cell.x, y: cell.y}
      // }).then(([{won, turn, field}, cbAsync])=> {
      //   if (won) {
      //     this.roomCtrl.finish(won);
      //   } else {
      //     this.turn = turn;
      //     this.field = field;
      //   }
      // }).catch(()=> {
      //   console.log('failed move', this.selected, cell);
      // }).finally(()=> {
      //   unselect();
      // });
    };

    const doEscape = ()=> {
      console.log('emit escape', this.selected);
      unselect();
      // this.emitting = this.roomCtrl.socket.emitAsync('escape', {
      //   x: this.selected.x,
      //   t: this.selected.y
      // }).then(([won])=> {
      //   console.log('succeeded escape', won);
      //   this.roomCtrl.finish(won);
      // }).catch(()=> {
      //   console.log('failed escape');
      // });
    };

    class Cell {
      constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
      }
      isGood() {
        return this.type == '+';
      }
      isBad() {
        return this.type == '-';
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
    }

    const indexToVector = (index)=> ({x: index % 6, y: Math.floor(index / 6)});
  }
});
