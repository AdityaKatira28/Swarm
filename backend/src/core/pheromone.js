// backend/src/core/pheromone.js

const logger = require('../utils/logger');
const config = require('../utils/config');
const { getClient } = require('../utils/redisClient');

class Pheromone {
  constructor() {
    // Note: getClient() returns a promise if not yet connected; but constructor is sync.
    // Ensure that Redis connection is established before Pheromone usage.
    this.redisPromise = getClient();
  }

  _streamKey(prefix, region) {
    return `${prefix}:${region}`;
  }

  /**
   * Publish a warning pheromone, trimming aggressively for high-throughput.
   * @param {object} data - fields to include
   * @returns {Promise<string>} - Redis stream entry ID
   */
  async publishWarning(data) {
    const redis = await this.redisPromise;
    const region = data.region;
    const key = this._streamKey(config.streams.warningPrefix, region);
    const timestamp = Date.now().toString();
    const entry = { ...data, timestamp };

    try {
      const id = await redis.xAdd(key, '*', entry);
      // Aggressive trimming: keep maxlen 500 with limit scan for performance
      await redis.xTrim(key, {
        strategy: 'MAXLEN',
        strategyValue: 500,
        LIMIT: 100,
      });
      logger.info('Published warning pheromone', { stream: key, id, data: entry });
      return id;
    } catch (err) {
      logger.error('Error publishing warning pheromone', { stream: key, error: err });
      throw err;
    }
  }

  /**
   * Publish an alert pheromone, trimming aggressively.
   * @param {object} data
   * @returns {Promise<string>}
   */
  async publishAlert(data) {
    const redis = await this.redisPromise;
    const region = data.region;
    const key = this._streamKey(config.streams.alertPrefix, region);
    const timestamp = Date.now().toString();
    const entry = { ...data, timestamp };

    try {
      const id = await redis.xAdd(key, '*', entry);
      await redis.xTrim(key, {
        strategy: 'MAXLEN',
        strategyValue: 500,
        LIMIT: 100,
      });
      logger.info('Published alert pheromone', { stream: key, id, data: entry });
      return id;
    } catch (err) {
      logger.error('Error publishing alert pheromone', { stream: key, error: err });
      throw err;
    }
  }

  /**
   * Read entries from a Redis stream with retry/backoff.
   * @param {string} prefix
   * @param {string} region
   * @param {string} lastId
   * @param {object} options - { maxRetries, timeout }
   * @returns {Promise<Array<{id: string, data: object}>>}
   */
  async readStream(prefix, region, lastId, options = {}) {
    const redis = await this.redisPromise;
    const key = this._streamKey(prefix, region);
    const { maxRetries = 3, timeout = 5000 } = options;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await redis.xRead(
          { key, id: lastId },
          { COUNT: 100, BLOCK: timeout }
        );
        if (result && result.length > 0) {
          const messages = result[0].messages.map(({ id, message }) => ({ id, data: message }));
          return messages;
        }
        return [];
      } catch (err) {
        logger.error(`Stream read attempt ${attempt + 1} failed`, {
          stream: key,
          error: err,
        });
        if (attempt === maxRetries - 1) {
          throw err;
        }
        // exponential backoff before retry
        const backoffMs = 1000 * (attempt + 1);
        await new Promise(res => setTimeout(res, backoffMs));
      }
    }
    // Should not reach here
    return [];
  }

  /**
   * Filter messages whose timestamp field is within last windowMs.
   * @param {Array<{id: string, data: object}>} messages
   * @param {number} windowMs
   * @returns {Array<{id: string, data: object}>}
   */
  filterRecent(messages, windowMs) {
    const now = Date.now();
    return messages.filter(({ data }) => {
      const ts = parseInt(data.timestamp, 10) || 0;
      return now - ts <= windowMs;
    });
  }
}

module.exports = Pheromone;
