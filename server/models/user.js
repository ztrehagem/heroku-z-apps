var Sequelize = require('sequelize');
var entity = require('server/entity');

var User = module.exports = entity.define('user', {
  name: {type: Sequelize.STRING, unique: true},
  bio: Sequelize.TEXT
});
