// backend/src/websocketServer.js
const WebSocket = require('ws');
const config = require('./utils/config');
const logger = require('./utils/logger');

function setupWebSocketServer(httpServer) {
  const wss = new WebSocket.Server({ server: httpServer, path: config.wsPath });
  wss.on('connection', (ws) => {
    logger.info('Frontend connected via WebSocket');
    ws.on('message', (message) => {
      logger.info('Received from frontend', { message });
      // handle incoming ws messages if needed
    });
    ws.on('close', () => {
      logger.info('WebSocket connection closed by client');
    });
  });

  function broadcastEvent(type, payload) {
    const msg = JSON.stringify({ type, payload });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  return { broadcastEvent };
}

module.exports = setupWebSocketServer;
