// backend/src/agents/responseAgent.js

const Pheromone = require('../core/pheromone');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { getClient } = require('../utils/redisClient');
const DistributedLock = require('../utils/distributedLock');

class ResponseAgent {
  constructor(broadcastEvent) {
    this.id = config.agentId;
    this.region = config.regionId;
    this.pollIntervalMs = config.response.pollIntervalMs;
    this.isolationDurationMs = config.response.isolationDurationMs;
    this.scanDurationMs = config.response.scanDurationMs;
    this.lockTtlMs = config.response.lockTtlMs;
    this.pheromone = new Pheromone();
    this.broadcastEvent = broadcastEvent;
    this.redisPromise = getClient();
    this.lock = null; // will initialize when Redis is ready

    this.lastAlertId = '$';

    this.errorCount = 0;
    // Ensure DistributedLock is ready once Redis is connected
    this.redisPromise.then(redis => {
      this.lock = new DistributedLock(redis, this.lockTtlMs);
    }).catch(err => {
      logger.error('ResponseAgent failed to initialize Redis for lock', { error: err });
    });

    logger.info(`${this.id} initialized as ResponseAgent`, { region: this.region });
    this.startLoop();
  }

  startLoop() {
    this.interval = setInterval(() => {
      this.respondWrapper();
    }, this.pollIntervalMs);
  }

  async respondWrapper() {
    try {
      await this.respond();
      this.errorCount = 0;
    } catch (err) {
      logger.error('ResponseAgent respond error', { agentId: this.id, error: err });
      this.errorCount += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, this.errorCount), 30000);
      logger.info('Backing off ResponseAgent due to error', { agentId: this.id, backoffMs });
      clearInterval(this.interval);
      setTimeout(() => this.startLoop(), backoffMs);
      if (this.errorCount > 5) {
        logger.warn('High ResponseAgent error count; manual intervention may be needed', { agentId: this.id, errorCount: this.errorCount });
      }
    }
  }

  async respond() {
    const alertPrefix = config.streams.alertPrefix;
    const messages = await this.pheromone.readStream(alertPrefix, this.region, this.lastAlertId);
    if (messages.length > 0) {
      this.lastAlertId = messages[messages.length - 1].id;
    }
    const recentAlerts = this.pheromone.filterRecent(messages, config.aggregator.slidingWindowMs);
    for (const msg of recentAlerts) {
      const alertId = msg.id;
      const alertData = msg.data;
      const lockKey = `lock:alert:${alertId}`;
      // Wait until lock utility is ready
      if (!this.lock) {
        logger.warn('DistributedLock not ready yet; skipping alert', { alertId });
        continue;
      }
      const lockAcquired = await this.lock.acquire(lockKey, this.id);
      if (!lockAcquired) {
        continue;
      }
      try {
        logger.info('Handling alert', { agentId: this.id, alertId, alertData });
        this.broadcastEvent('responseStart', { agentId: this.id, alertId, data: alertData, timestamp: Date.now() });

        // Simulate isolation and scan
        logger.info('Isolating node...', { alertId });
        await this.delay(this.isolationDurationMs);
        logger.info('Scanning node...', { alertId });
        await this.delay(this.scanDurationMs);
        logger.info('Releasing isolation', { alertId });
        this.broadcastEvent('responseComplete', { agentId: this.id, alertId, timestamp: Date.now() });
      } finally {
        // Release lock after handling; if release fails, it will expire by TTL
        const released = await this.lock.release(lockKey, this.id);
        if (!released) {
          logger.warn('ResponseAgent failed to release lock (may have expired)', { lockKey, agentId: this.id });
        }
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    clearInterval(this.interval);
    logger.info(`${this.id} stopped ResponseAgent`);
  }
}

module.exports = ResponseAgent;
