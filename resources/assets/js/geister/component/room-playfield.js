app.component('roomPlayfield', {
  templateUrl: asset.template('room-playfield'),
  require: {
    roomCtrl: '^room'
  },
  controller() {
    'ngInject';

    this.$onInit = ()=> {
      this.field = null;
      this.selected = null;

      this.roomCtrl.socket.emit('get-field', null, field => {
        this.field = (this.roomCtrl.userType == 'host' ? field : field.reverse())
          .reduce((result, raw, index)=> {
            const {x, y} = indexToVector(index);
            if (!result[y]) result[y] = [];
            result[y][x] = new Cell(raw, x, y);
            return result;
          }, []);
      });
    };

    this.select = (cell)=> {
      if (this.selected) {
        if (this.selected.isMovableTo(cell)) {
          console.log('move', this.selected, cell);
        } else {
          console.log('cant move', cell);
        }
        this.selected = null;
      } else {
        if (cell.isMine()) {
          this.selected = cell;
          console.log('selected', cell);
        }
      }
    };

    class Cell {
      constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
      }
      isMine() {
        return this.type == '+' || this.type == '-';
      }
      isNextTo(cell) {
        return Math.abs(cell.x - this.x) + Math.abs(cell.y - this.y) == 1;
      }
      isMovableTo(cell) {
        return !cell.isMine() && this.isNextTo(cell);
      }
    }

    const indexToVector = (index)=> ({x: index % 6, y: Math.floor(index / 6)});
  }
});
