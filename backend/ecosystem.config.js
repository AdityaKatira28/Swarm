// PM2 Ecosystem Configuration
module.exports = {
  apps: [
    {
      name: 'sensor-agent',
      script: 'src/index.js',
      cwd: '/app',
      env: {
        AGENT_TYPE: 'sensor',
        AGENT_ID: 'sensor-1',
        REGION_ID: 'north',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 5000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      log_file: './logs/sensor.log',
      error_file: './logs/sensor-error.log',
      out_file: './logs/sensor-out.log',
      time: true
    },
    {
      name: 'aggregator-agent',
      script: 'src/index.js',
      cwd: '/app',
      env: {
        AGENT_TYPE: 'aggregator',
        AGENT_ID: 'agg-1',
        REGION_ID: 'north',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 5000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      log_file: './logs/aggregator.log',
      error_file: './logs/aggregator-error.log',
      out_file: './logs/aggregator-out.log',
      time: true
    },
    {
      name: 'response-agent',
      script: 'src/index.js',
      cwd: '/app',
      env: {
        AGENT_TYPE: 'response',
        AGENT_ID: 'resp-1',
        REGION_ID: 'north',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 5000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      log_file: './logs/response.log',
      error_file: './logs/response-error.log',
      out_file: './logs/response-out.log',
      time: true
    },
    {
      name: 'simulator-agent',
      script: 'src/index.js',
      cwd: '/app',
      env: {
        AGENT_TYPE: 'simulator',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 5000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      log_file: './logs/simulator.log',
      error_file: './logs/simulator-error.log',
      out_file: './logs/simulator-out.log',
      time: true
    }
  ]
};