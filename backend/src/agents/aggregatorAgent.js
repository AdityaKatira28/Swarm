// backend/src/agents/aggregatorAgent.js

const Pheromone = require('../core/pheromone');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { getClient } = require('../utils/redisClient');

class AggregatorAgent {
  constructor(broadcastEvent) {
    this.id = config.agentId;
    this.region = config.regionId;
    this.pollIntervalMs = config.aggregator.pollIntervalMs;
    this.quorumRatio = config.aggregator.quorumRatio;
    this.slidingWindowMs = config.aggregator.slidingWindowMs;
    this.totalSensorsStatic = config.aggregator.totalSensors;
    this.pheromone = new Pheromone();
    this.broadcastEvent = broadcastEvent;
    this.redisPromise = getClient();

    this.lastWarningId = '$';

    logger.info(`${this.id} initialized as AggregatorAgent`, { region: this.region, quorumRatio: this.quorumRatio });
    this.errorCount = 0;
    this.startLoop();
  }

  startLoop() {
    this.interval = setInterval(() => {
      this.aggregateWrapper();
    }, this.pollIntervalMs);
  }

  async aggregateWrapper() {
    try {
      await this.aggregate();
      this.errorCount = 0;
    } catch (err) {
      logger.error('AggregatorAgent aggregate error', { agentId: this.id, error: err });
      this.errorCount += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, this.errorCount), 30000);
      logger.info('Backing off AggregatorAgent due to error', { agentId: this.id, backoffMs });
      clearInterval(this.interval);
      setTimeout(() => this.startLoop(), backoffMs);
      if (this.errorCount > 5) {
        logger.warn('High AggregatorAgent error count; manual intervention may be needed', { agentId: this.id, errorCount: this.errorCount });
      }
    }
  }

  async aggregate() {
    const warningPrefix = config.streams.warningPrefix;
    // Read with retry/backoff handled internally
    const messages = await this.pheromone.readStream(warningPrefix, this.region, this.lastWarningId);
    if (messages.length > 0) {
      this.lastWarningId = messages[messages.length - 1].id;
    }
    const recentMsgs = this.pheromone.filterRecent(messages, this.slidingWindowMs);
    if (recentMsgs.length > 0) {
      logger.info('Aggregator found recent warnings', { agentId: this.id, count: recentMsgs.length });
    }

    // Determine total sensors: static or dynamic
    let totalSensors = this.totalSensorsStatic;
    if (!totalSensors) {
      try {
        const redis = await this.redisPromise;
        const setKey = `sensors:${this.region}`;
        const count = await redis.sCard(setKey);
        if (count > 0) totalSensors = count;
      } catch (err) {
        logger.error('Error retrieving dynamic sensor count', { agentId: this.id, error: err });
        totalSensors = 0;
      }
    }
    if (!totalSensors) {
      logger.warn('Total sensors unknown or zero; skipping quorum check', { agentId: this.id });
      return;
    }
    const thresholdCount = Math.ceil(totalSensors * this.quorumRatio);

    const uniqueSensors = new Set(recentMsgs.map(msg => msg.data.agentId));
    const uniqueCount = uniqueSensors.size;
    if (uniqueCount >= thresholdCount) {
      logger.info('Quorum reached, publishing alert', { agentId: this.id, uniqueCount, thresholdCount });
      const data = { agentId: this.id, count: uniqueCount.toString(), region: this.region };
      const alertId = await this.pheromone.publishAlert(data);
      this.broadcastEvent('aggregatorAlert', { agentId: this.id, data: { ...data, timestamp: Date.now() }, id: alertId });
    }
  }

  stop() {
    clearInterval(this.interval);
    logger.info(`${this.id} stopped AggregatorAgent`);
  }
}

module.exports = AggregatorAgent;
