// backend/src/utils/redisClient.js
const { createClient } = require('redis');
const logger = require('./logger');
const config = require('./config');

class RedisManager {
  constructor() {
    this.client = null;
    this.connecting = false;
    this.waiters = [];
  }

  async connect() {
    if (this.client && this.client.isOpen) {
      return this.client;
    }
    if (this.connecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        this.waiters.push({ resolve, reject });
      });
    }
    this.connecting = true;
    try {
      const options = { url: config.redisUrl };
      if (config.redisPassword) {
        options.password = config.redisPassword;
      }
      if (process.env.REDIS_TLS === 'true') {
        options.socket = { tls: true, rejectUnauthorized: true };
      }
      this.client = createClient(options);
      this.client.on('error', (err) => logger.error('Redis Client Error', { error: err }));
      this.client.on('reconnecting', () => logger.info('Redis reconnecting...'));
      await this.client.connect();
      logger.info('Connected to Redis');
      // Notify any waiters
      this.waiters.forEach(w => w.resolve(this.client));
      this.waiters = [];
      return this.client;
    } catch (err) {
      // Notify waiters of failure
      this.waiters.forEach(w => w.reject(err));
      this.waiters = [];
      throw err;
    } finally {
      this.connecting = false;
    }
  }

  async getClient() {
    if (!this.client || !this.client.isOpen) {
      return this.connect();
    }
    return this.client;
  }
}

const redisManager = new RedisManager();

module.exports = {
  connectRedis: () => redisManager.connect(),
  getClient: () => redisManager.getClient(),
};
