const Pheromone = require('./pheromone');
const config = require('../utils/config');
const logger = require('../utils/logger');

class AnomalySimulator {
  constructor(broadcastEvent) {
    this.pheromone = new Pheromone();
    this.interval = null;
    this.broadcastEvent = broadcastEvent;
    logger.info('Anomaly Simulator initialized');
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.simulate().catch(err => logger.error('Simulator error', { error: err }));
    }, config.simulator.simulateIntervalMs);
    logger.info('Anomaly Simulator started', { intervalMs: config.simulator.simulateIntervalMs });
  }

  async simulate() {
    // Use config.regionId
    const region = config.regionId;
    // Lateral movement
    if (Math.random() < 0.05) {
      logger.info('Simulating lateral movement attack', { region });
      await this.pheromone.publishWarning({ agentId: 'simulator', type: 'lateral_movement', region });
      this.broadcastEvent('simulatorAnomaly', { agentId: 'simulator', type: 'lateral_movement', region, timestamp: Date.now() });
    }
    // False positive
    if (Math.random() < 0.02) {
      logger.info('Simulating false positive', { region });
      await this.pheromone.publishWarning({ agentId: 'simulator', type: 'false_positive', region });
      this.broadcastEvent('simulatorFalsePositive', { agentId: 'simulator', type: 'false_positive', region, timestamp: Date.now() });
    }
  }

  async triggerManualAnomaly(region = config.regionId) {
    logger.info('Manually triggering anomaly', { region });
    await this.pheromone.publishWarning({ agentId: 'manual', type: 'manual_trigger', region });
    this.broadcastEvent('simulatorManualTrigger', { agentId: 'manual', type: 'manual_trigger', region, timestamp: Date.now() });
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Anomaly Simulator stopped');
    }
  }
}

module.exports = AnomalySimulator;
