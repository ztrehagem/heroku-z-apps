app.component('nameEditor', {
  templateUrl: asset.template('name-editor'),
  require: {
    rootCtrl: '^root'
  },
  controller(me, $filter) {
    'ngInject';

    this.updateName = ()=> {
      me.update({name: this.nameTemp}).then(()=> {
        this.isShowForm = false;
      });
    };

    this.showForm = ()=> {
      this.nameTemp = me.name;
      this.isShowForm = true;
    };

    this.cancel = ()=> {
      this.isShowForm = false;
    };

    this.isVisible = ()=> $filter('qstate')(me.initialized, 'succeeded');
  }
});
