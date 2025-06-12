// backend/src/agents/sensorAgent.js

const Pheromone = require('../core/pheromone');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { getClient } = require('../utils/redisClient');

class SensorAgent {
  constructor(broadcastEvent) {
    this.id = config.agentId;
    this.region = config.regionId;
    this.threshold = config.sensor.threshold;
    this.pollIntervalMs = config.sensor.pollIntervalMs;
    this.neighborWindowMs = config.sensor.neighborWindowMs;
    this.pheromone = new Pheromone();
    this.broadcastEvent = broadcastEvent;

    // For reading neighbor messages: track lastId
    this.lastWarningId = '$';

    // Subscribe to feedback channel
    this.redisPromise = getClient();
    this.subscribeFeedback();

    logger.info(`${this.id} initialized as SensorAgent`, { region: this.region, threshold: this.threshold });
    this.errorCount = 0;
    this.startLoop();
  }

  subscribeFeedback() {
    this.redisPromise.then(redis => {
      const channel = `feedback:${this.id}`;
      // Node Redis v4: subscribe returns an async iterator or callback form
      redis.subscribe(channel, (message) => {
        try {
          const fb = JSON.parse(message);
          logger.info('Received feedback', { channel, feedback: fb });
          if (fb.feedbackType === 'false_positive') {
            this.threshold = Math.min(0.99, this.threshold + 0.05);
            logger.info('Adjusted threshold upward due to false positive', { newThreshold: this.threshold });
          } else if (fb.feedbackType === 'true_positive') {
            this.threshold = Math.max(0.01, this.threshold - 0.05);
            logger.info('Adjusted threshold downward due to true positive', { newThreshold: this.threshold });
          }
        } catch (err) {
          logger.error('Error parsing feedback message', { error: err });
        }
      }).then(() => {
        logger.info('Subscribed to feedback channel', { channel });
      }).catch(err => {
        logger.error('Failed to subscribe to feedback channel', { channel, error: err });
      });
    }).catch(err => {
      logger.error('Cannot subscribe feedback, Redis unavailable', { error: err });
    });
  }

  startLoop() {
    this.interval = setInterval(() => {
      this.monitorWrapper();
    }, this.pollIntervalMs);
  }

  async monitorWrapper() {
    try {
      await this.monitor();
      // Reset errorCount on success
      this.errorCount = 0;
    } catch (err) {
      logger.error('SensorAgent monitor error', { agentId: this.id, error: err });
      this.errorCount += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, this.errorCount), 30000);
      logger.info('Backing off SensorAgent due to error', { agentId: this.id, backoffMs });
      clearInterval(this.interval);
      setTimeout(() => this.startLoop(), backoffMs);
      if (this.errorCount > 5) {
        logger.warn('High SensorAgent error count; manual intervention may be needed', { agentId: this.id, errorCount: this.errorCount });
      }
    }
  }

  async monitor() {
    // Simulate local metric
    const metric = Math.random();
    let localDetected = false;
    if (metric > this.threshold) {
      localDetected = true;
      logger.info('Local anomaly detected', { agentId: this.id, metric });
    }

    // Read neighbor pheromones
    const warningPrefix = config.streams.warningPrefix;
    // Use improved readStream with default options
    const messages = await this.pheromone.readStream(warningPrefix, this.region, this.lastWarningId);
    if (messages.length > 0) {
      this.lastWarningId = messages[messages.length - 1].id;
    }
    const recentMsgs = this.pheromone.filterRecent(messages, this.neighborWindowMs);
    const neighborCount = recentMsgs.filter(msg => msg.data.agentId !== this.id).length;
    if (neighborCount > 0) {
      logger.info('Neighbor signals found', { agentId: this.id, neighborCount });
    }

    // Amplification logic
    let amplify = false;
    if (localDetected && neighborCount >= 1) {
      amplify = true;
    }

    if (localDetected || amplify) {
      const data = {
        agentId: this.id,
        metric: metric.toFixed(2),
        region: this.region,
        amplified: amplify ? 'true' : 'false',
      };
      const id = await this.pheromone.publishWarning(data);
      this.broadcastEvent('sensorPheromone', { agentId: this.id, data: { ...data, timestamp: Date.now() }, id });
    }
  }

  stop() {
    clearInterval(this.interval);
    logger.info(`${this.id} stopped SensorAgent`);
  }
}

module.exports = SensorAgent;
