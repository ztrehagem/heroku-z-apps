var Sequelize = require('sequelize');
var entity = require('entity');

var User = module.exports = entity.define('user', {
  name: Sequelize.STRING,
  password: Sequelize.STRING,
  bio: Sequelize.STRING
});
