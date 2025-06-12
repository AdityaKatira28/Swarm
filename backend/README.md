# Distributed Anomaly Response Swarm - Backend

## Overview
Runs one of several agent types based on AGENT_TYPE environment variable. Connects to Redis Streams for pheromone coordination and exposes WebSocket & REST API for frontend and controls.

## Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill values.
3. Run with: `npm start` (ensure AGENT_TYPE is set).

## Agent Types
- **sensor**: Local anomaly detection, publishes warning pheromones; subscribes to feedback channel to adjust threshold.
- **aggregator**: Reads warnings in region, quorum logic (static TOTAL_SENSORS or dynamic Redis set), publishes alerts.
- **response**: Reads alerts, uses Redis lock (TTL > handling time) to coordinate mitigation, broadcasts response events.
- **simulator**: Publishes simulated anomalies at intervals or via manual trigger.

## Endpoints
- **WebSocket**: ws://<host>:<PORT><WS_PATH>, receives JSON `{ type, payload }`.
- **HTTP**:
  - `GET /health`: health status.
  - `POST /trigger` (body `{ region }`): manual anomaly trigger.
  - `POST /feedback` (body `{ agentId, detectionId, feedbackType }`): send feedback to sensors.

## Deployment
Deploy separate processes for each AGENT_TYPE to scale. Ensure Redis credentials and TLS settings correct. For Upstash, set REDIS_TLS=true and REDIS_URL accordingly.

## Notes
- For dynamic sensor discovery, implement registration in Redis set `sensors:<region>` and aggregator reads sCard.
- Ensure lock TTL in ResponseAgent covers isolation+scan durations.
- Confirm Redis Stream methods (`xAdd`, `xRead`) match installed Redis client version.