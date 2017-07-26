app.component('resultPanel', {
  templateUrl: asset.template('result-panel'),
  require: {
    roomCtrl: '^room'
  },
  bindings: {
    result: '<'
  },
  controller($scope) {
    'ngInject';

    this.$onInit = ()=> {
      this.u = this.roomCtrl.userType[0];
      this.n = this.u == 'h' ? 'g' : 'h';
    };

    $scope.$watch(()=> this.result, ()=> {
      const dest = this.result && this.result.dest;
      const type = dest && dest.type;
      this.status = getStatus(type);
    });

    const getStatus = (type)=> {
      switch (type && type[0]) {
        case `${this.u}`: return `self${type[1]}`;
        case `${this.n}`: return `rival${type[1]}`;
        default: return '';
      }
    }
  }
});
