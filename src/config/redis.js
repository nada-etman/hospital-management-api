const Redis = require('ioredis');
const logger = require('./logger');

let redis = null;

// Redis is optional — the app must still work if it isn't configured/available.
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't keep retrying forever in dev
    lazyConnect: true,
  });

  redis.connect().catch(() => {
    logger.warn('Redis not available — continuing without cache.');
  });

  redis.on('error', (err) => logger.warn(`Redis error: ${err.message}`));
}

module.exports = redis;
