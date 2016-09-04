var Sequelize = require('sequelize');
module.exports = new Sequelize(process.env.DATABASE_URL || 'postgresql://heroku@localhost/heroku-test');
