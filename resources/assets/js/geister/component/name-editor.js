app.component('nameEditor', {
  templateUrl: asset.template('name-editor'),
  require: {
    rootCtrl: '^root'
  },
  controller(apiMe) {
    'ngInject';

    this.name = null;

    this.$onInit = ()=> {
      this.initialized = apiMe.get().then(me => this.name = me.name);
    };

    this.updateName = ()=> {
      apiMe.updateName(this.nameTemp).then(resp => {
        this.name = resp.name;
        this.isShowForm = false;
      });
    };

    this.showForm = ()=> {
      this.nameTemp = this.name;
      this.isShowForm = true;
    };

    this.cancel = ()=> {
      this.isShowForm = false;
    };
  }
});
