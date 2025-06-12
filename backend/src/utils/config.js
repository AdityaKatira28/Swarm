// backend/src/utils/config.js

const dotenv = require('dotenv');
dotenv.config();

// Base config from environment
const rawConfig = {
  // Redis
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD || null,

  // Agent settings
  agentType: process.env.AGENT_TYPE, // 'sensor' | 'aggregator' | 'response' | 'simulator'
  agentId: process.env.AGENT_ID || `agent-${Math.floor(Math.random() * 10000)}`,
  regionId: process.env.REGION_ID || 'default-region',

  // Sensor settings
  SENSOR_THRESHOLD: process.env.SENSOR_THRESHOLD,
  SENSOR_POLL_INTERVAL_MS: process.env.SENSOR_POLL_INTERVAL_MS,
  SENSOR_NEIGHBOR_WINDOW_MS: process.env.SENSOR_NEIGHBOR_WINDOW_MS,

  // Aggregator settings
  AGGREGATOR_POLL_INTERVAL_MS: process.env.AGGREGATOR_POLL_INTERVAL_MS,
  AGGREGATOR_QUORUM_RATIO: process.env.AGGREGATOR_QUORUM_RATIO,
  AGGREGATOR_WINDOW_MS: process.env.AGGREGATOR_WINDOW_MS,
  TOTAL_SENSORS: process.env.TOTAL_SENSORS,

  // Response settings
  RESPONSE_POLL_INTERVAL_MS: process.env.RESPONSE_POLL_INTERVAL_MS,
  RESPONSE_ISOLATION_MS: process.env.RESPONSE_ISOLATION_MS,
  RESPONSE_SCAN_MS: process.env.RESPONSE_SCAN_MS,
  RESPONSE_LOCK_TTL_MS: process.env.RESPONSE_LOCK_TTL_MS,

  // Simulator settings
  ENABLE_SIMULATOR: process.env.ENABLE_SIMULATOR,
  SIMULATOR_INTERVAL_MS: process.env.SIMULATOR_INTERVAL_MS,

  // HTTP / WebSocket
  PORT: process.env.PORT,
  WS_PATH: process.env.WS_PATH,

  // Streams prefixes
  WARNING_PREFIX: process.env.WARNING_PREFIX,
  ALERT_PREFIX: process.env.ALERT_PREFIX,
};

function validateConfig(cfg) {
  const missing = [];
  // Required keys
  if (!cfg.redisUrl) missing.push('REDIS_URL');
  if (!cfg.agentType) missing.push('AGENT_TYPE');
  if (!cfg.regionId) missing.push('REGION_ID');
  // Validate sensor if type=sensor or aggregator depends on sensor config etc.
  // But minimally require numeric envs parseable if present.
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  return cfg;
}

const env = validateConfig(rawConfig);

// Build typed config
const config = {
  // Redis
  redisUrl: env.redisUrl,
  redisPassword: env.redisPassword,

  // Agent settings
  agentType: env.agentType,
  agentId: env.agentId,
  regionId: env.regionId,

  // Sensor settings
  sensor: {
    threshold: parseFloat(env.SENSOR_THRESHOLD) || 0.7,
    pollIntervalMs: parseInt(env.SENSOR_POLL_INTERVAL_MS, 10) || 5000,
    neighborWindowMs: parseInt(env.SENSOR_NEIGHBOR_WINDOW_MS, 10) || 30000,
  },

  // Aggregator settings
  aggregator: {
    pollIntervalMs: parseInt(env.AGGREGATOR_POLL_INTERVAL_MS, 10) || 5000,
    quorumRatio: parseFloat(env.AGGREGATOR_QUORUM_RATIO) || 0.7,
    slidingWindowMs: parseInt(env.AGGREGATOR_WINDOW_MS, 10) || 30000,
    totalSensors: env.TOTAL_SENSORS ? parseInt(env.TOTAL_SENSORS, 10) : null,
  },

  // Response settings
  response: {
    pollIntervalMs: parseInt(env.RESPONSE_POLL_INTERVAL_MS, 10) || 5000,
    isolationDurationMs: parseInt(env.RESPONSE_ISOLATION_MS, 10) || 10000,
    scanDurationMs: parseInt(env.RESPONSE_SCAN_MS, 10) || 2000,
    lockTtlMs: parseInt(env.RESPONSE_LOCK_TTL_MS, 10) || 15000,
  },

  // Simulator settings
  simulator: {
    enabled: env.ENABLE_SIMULATOR === 'true',
    simulateIntervalMs: parseInt(env.SIMULATOR_INTERVAL_MS, 10) || 1000,
  },

  // WebSocket / HTTP
  port: parseInt(env.PORT, 10) || 3000,
  wsPath: env.WS_PATH || '/ws',

  // Stream prefixes (with defaults if not set)
  streams: {
    warningPrefix: env.WARNING_PREFIX || 'warning_pheromones',
    alertPrefix: env.ALERT_PREFIX || 'alert_pheromones',
  },
};

module.exports = config;
