const redis = require('redis');
const redisUrl = process.env.REDIS_URL;

module.exports = ()=> redis.createClient(redisUrl);
module.exports.global = redis.createClient(redisUrl);
