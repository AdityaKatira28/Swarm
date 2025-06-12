// backend/src/utils/distributedLock.js

class DistributedLock {
  /**
   * @param {import('redis').RedisClientType} redisClient - instance from redisManager.getClient()
   * @param {number} ttlMs - lock TTL in milliseconds
   */
  constructor(redisClient, ttlMs = 5000) {
    this.redis = redisClient;
    this.ttlMs = ttlMs;
  }

  /**
   * Attempt to acquire the lock key with ownerId and TTL.
   * @param {string} key
   * @param {string} ownerId
   * @returns {Promise<boolean>}
   */
  async acquire(key, ownerId) {
    try {
      const result = await this.redis.set(key, ownerId, {
        NX: true,
        PX: this.ttlMs,
      });
      return result === 'OK';
    } catch (err) {
      // Log upstream if needed
      return false;
    }
  }

  /**
   * Extend the lock TTL if ownerId matches.
   * @param {string} key
   * @param {string} ownerId
   * @param {number} ttlMs
   * @returns {Promise<boolean>}
   */
  async extend(key, ownerId, ttlMs = this.ttlMs) {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("PEXPIRE", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    try {
      const result = await this.redis.eval(script, {
        keys: [key],
        arguments: [ownerId, ttlMs],
      });
      return result === 1;
    } catch (err) {
      return false;
    }
  }

  /**
   * Release the lock if ownerId matches.
   * @param {string} key
   * @param {string} ownerId
   * @returns {Promise<boolean>}
   */
  async release(key, ownerId) {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    try {
      const result = await this.redis.eval(script, {
        keys: [key],
        arguments: [ownerId],
      });
      return result === 1;
    } catch (err) {
      return false;
    }
  }
}

module.exports = DistributedLock;
