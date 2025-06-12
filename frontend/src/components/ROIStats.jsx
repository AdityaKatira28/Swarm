import React, { useEffect, useState } from 'react';
import websocketService from '../services/websocketService';

export default function ROIStats() {
  const [detections, setDetections] = useState([]);
  const [responses, setResponses] = useState([]);
  const [pending, setPending] = useState({}); // map alertId -> detectionTimestamp

  useEffect(() => {
    const unsubSensor = websocketService.subscribe('sensorPheromone', (payload) => {
      // track sensor events if needed
    });
    const unsubAgg = websocketService.subscribe('aggregatorAlert', (payload) => {
      const alertId = payload.id;
      const now = payload.data.timestamp;
      // For demo: assume detection began at first warning time unknown; skip detection time
      // Could track earliest sensor timestamp; omitted here
      // For simplicity, record detection as 0 or use payload timestamp
      setDetections(prev => [...prev, 0]);
      // Mark pending for response timing
      setPending(prev => ({ ...prev, [alertId]: now }));
    });
    const unsubStart = websocketService.subscribe('responseStart', (payload) => {
      const alertId = payload.alertId;
      const startTs = payload.timestamp;
      const detectTs = pending[alertId] || startTs;
      const timeToDetect = startTs - detectTs;
      setDetections(prev => [...prev, timeToDetect]);
      setPending(prev => ({ ...prev, [alertId]: startTs }));
    });
    const unsubComplete = websocketService.subscribe('responseComplete', (payload) => {
      const alertId = payload.alertId;
      const completeTs = payload.timestamp;
      const startTs = pending[alertId];
      if (startTs) {
        const timeToResolve = completeTs - startTs;
        setResponses(prev => [...prev, timeToResolve]);
        setPending(prev => {
          const copy = { ...prev };
          delete copy[alertId];
          return copy;
        });
      }
    });
    return () => { unsubSensor(); unsubAgg(); unsubStart(); unsubComplete(); };
  }, [pending]);

  const avg = arr => arr.length ? Math.round(arr.reduce((a,b) => a+b,0)/arr.length) : '-';

  return (
    <div>
      <h3>ROI Stats</h3>
      <p>Average Time to Detect: {avg(detections)} ms</p>
      <p>Average Time to Resolve: {avg(responses)} ms</p>
      <p>False Positive Rate: N/A (requires feedback integration)</p>
    </div>
  );
}