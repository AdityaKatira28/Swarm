import React, { useEffect, useState } from 'react';
import websocketService from '../services/websocketService';

export default function NetworkGraph() {
  const [nodes, setNodes] = useState([]);
  // For demo, edges omitted or statically defined

  useEffect(() => {
    const unsubSensor = websocketService.subscribe('sensorPheromone', (payload) => {
      const id = payload.data.agentId;
      setNodes(prev => prev.includes(id) ? prev : [...prev, id]);
    });
    const unsubAgg = websocketService.subscribe('aggregatorAlert', (payload) => {
      const id = payload.data.agentId;
      setNodes(prev => prev.includes(id) ? prev : [...prev, id]);
    });
    const unsubResp = websocketService.subscribe('responseStart', (payload) => {
      const id = payload.agentId;
      setNodes(prev => prev.includes(id) ? prev : [...prev, id]);
    });
    return () => { unsubSensor(); unsubAgg(); unsubResp(); };
  }, []);

  return (
    <div>
      <h3>Network Graph (Nodes)</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {nodes.map(node => (
          <div key={node} style={{ padding: '8px', border: '1px solid #333', borderRadius: '4px' }}>{node}</div>
        ))}
      </div>
    </div>
  );
}