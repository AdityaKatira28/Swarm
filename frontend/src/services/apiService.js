const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function triggerAnomaly(region) {
  const res = await fetch(`${API_BASE}/trigger`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ region })
  });
  return res.json();
}

export async function sendFeedback(agentId, detectionId, feedbackType) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId, detectionId, feedbackType })
  });
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}