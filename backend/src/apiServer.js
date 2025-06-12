// backend/src/apiServer.js
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./utils/config');
const logger = require('./utils/logger');
const { getClient } = require('./utils/redisClient');

function setupApiServer(broadcastEvent, anomalySimulator) {
  const app = express();
  app.use(bodyParser.json());

  app.get('/health', async (req, res) => {
    try {
      const client = await getClient();
      const redisInfo = await client.info('memory');
      const usedMemoryMatch = redisInfo.match(/used_memory:(\d+)/);
      const usedMemory = usedMemoryMatch ? `${(parseInt(usedMemoryMatch[1]) / (1024 * 1024)).toFixed(2)}MB` : 'N/A';
      res.status(200).json({ status: 'healthy', region: config.regionId, redis: { usedMemory } });
    } catch (err) {
      logger.error('Health check error', { error: err });
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  });

  app.post('/trigger', async (req, res) => {
    const { region } = req.body;
    try {
      await anomalySimulator.triggerManualAnomaly(region);
      res.status(200).json({ status: 'triggered', region });
    } catch (err) {
      logger.error('Manual trigger error', { error: err });
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  app.post('/feedback', async (req, res) => {
    const { agentId, detectionId, feedbackType } = req.body;
    try {
      const client = await getClient();
      const channel = `feedback:${agentId}`;
      const payload = JSON.stringify({ detectionId, feedbackType, timestamp: Date.now() });
      await client.publish(channel, payload);
      res.status(200).json({ status: 'feedback_sent' });
    } catch (err) {
      logger.error('Feedback error', { error: err });
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return app;
}

module.exports = setupApiServer;
