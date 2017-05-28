require('app-module-path').addPath(__dirname);

const server = require('server');
const models = require('models');
const bluebird = require('bluebird');
const redis = require('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

models.sequelize.sync().then(()=> {
  server().listen(process.env.PORT);
  console.log('server has started');
}).catch((e)=> {
  console.error('failed starting server');
  console.error(e);
});
