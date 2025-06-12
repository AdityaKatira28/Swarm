# Distributed Anomaly Response Swarm - Frontend

## Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `VITE_WS_URL`, `VITE_API_BASE_URL`.
3. Run locally: `npm run dev` (http://localhost:5173).

## Features
- Heatmap: shows sensor pheromone intensity.
- NetworkGraph: displays agent nodes.
- ResponseTimeline: logs response events.
- ROIStats: computes detection/resolve times.
- Manual Trigger: send anomaly triggers via API.

## Notes
- For feedback integration, extend UI to send feedback via `sendFeedback`.
- Ensure CORS or proxy settings allow frontend to call backend.