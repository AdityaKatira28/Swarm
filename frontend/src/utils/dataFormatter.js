export function formatSensorPheromone(payload) {
  return {
    id: payload.id,
    agentId: payload.data.agentId,
    metric: parseFloat(payload.data.metric),
    amplified: payload.data.amplified === 'true',
    region: payload.data.region,
    timestamp: payload.data.timestamp,
  };
}

export function formatAggregatorAlert(payload) {
  return {
    id: payload.id,
    agentId: payload.data.agentId,
    count: parseInt(payload.data.count, 10),
    region: payload.data.region,
    timestamp: payload.data.timestamp,
  };
}

export function formatResponseEvent(type, payload) {
  return {
    type,
    agentId: payload.agentId,
    alertId: payload.alertId,
    timestamp: payload.timestamp,
  };
}