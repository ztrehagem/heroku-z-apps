module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('users', 'displayName', Sequelize.STRING);
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('users', 'displayName');
  }
};
