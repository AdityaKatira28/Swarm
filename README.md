# Distributed Anomaly Response Swarm Demo

## Structure
- backend/: Node.js agents and server
- frontend/: React + Vite UI

## Setup
1. Configure Redis (local or Upstash). Set REDIS_URL, REDIS_PASSWORD, REDIS_TLS as needed.
2. Backend:
   - `cd backend/src`
   - Copy `.env.example` to `.env`.
   - Run sensor: `AGENT_TYPE=sensor AGENT_ID=sensor-1 REGION_ID=north npm start`
   - Run aggregator: `AGENT_TYPE=aggregator AGENT_ID=agg-1 REGION_ID=north npm start`
   - Run response: `AGENT_TYPE=response AGENT_ID=resp-1 REGION_ID=north npm start`
   - (Optional) simulator: `AGENT_TYPE=simulator npm start`
3. Frontend:
   - `cd frontend`
   - Copy `.env.example`, set `VITE_WS_URL`, `VITE_API_BASE_URL`.
   - `npm install` and `npm run dev`.

## Deployment
- Deploy backend processes separately (e.g., Railway) with appropriate env vars.
- Deploy frontend to Vercel, set environment variables.

## Extending
- Implement dynamic sensor discovery via Redis sets.
- Enhance visualizations with chart libraries or graph layouts.
- Add authentication for API endpoints if needed.