// backend/src/index.js

const http = require('http');
const express = require('express');
const config = require('./utils/config');
const { connectRedis, getClient } = require('./utils/redisClient');
const setupWebSocketServer = require('./websocketServer');
const setupApiServer = require('./apiServer');
const logger = require('./utils/logger');
const SensorAgent = require('./agents/sensorAgent');
const AggregatorAgent = require('./agents/aggregatorAgent');
const ResponseAgent = require('./agents/responseAgent');
const AnomalySimulator = require('./core/anomalySimulator');

(async () => {
  try {
    // Connect to Redis (with retry logic in redisClient)
    await connectRedis();

    // Express app and HTTP server
    const app = express();
    const server = http.createServer(app);

    // WebSocket
    const { broadcastEvent } = setupWebSocketServer(server);

    // Anomaly simulator (not started yet)
    const simulator = new AnomalySimulator(broadcastEvent);

    // API server
    const apiApp = setupApiServer(broadcastEvent, simulator);
    app.use('/', apiApp);

    // Instantiate agent based on type
    const agentType = config.agentType;
    if (agentType === 'sensor') {
      const agent = new SensorAgent(broadcastEvent);
      // Optional: register sensor in Redis set for dynamic discovery
      getClient().then(client => {
        const setKey = `sensors:${config.regionId}`;
        client.sAdd(setKey, config.agentId).catch(err => logger.error('Error adding to sensor set', { error: err }));
      }).catch(err => {
        logger.error('Error registering sensor for dynamic discovery', { error: err });
      });
    } else if (agentType === 'aggregator') {
      new AggregatorAgent(broadcastEvent);
    } else if (agentType === 'response') {
      new ResponseAgent(broadcastEvent);
    } else if (agentType === 'simulator' || config.simulator.enabled) {
      simulator.start();
    } else {
      logger.warn('No valid AGENT_TYPE specified. Exiting.');
      process.exit(1);
    }

    // Start server
    const port = config.port;
    server.listen(port, () => {
      logger.info(`Backend server listening on port ${port}`, { agentType });
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down');
      simulator.stop();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      logger.info('Shutting down');
      simulator.stop();
      process.exit(0);
    });
  } catch (err) {
    logger.error('Fatal startup error', { error: err });
    process.exit(1);
  }
})();
