module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {type: Sequelize.STRING, unique: true, allowNull: false},
      bio: Sequelize.TEXT,
      createdAt: {type: Sequelize.DATE},
      updatedAt: {type: Sequelize.DATE}
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('users');
  }
};
