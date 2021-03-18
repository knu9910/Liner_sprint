const asyncRedis = require('async-redis');
const redis = asyncRedis.createClient();

module.exports = redis;
