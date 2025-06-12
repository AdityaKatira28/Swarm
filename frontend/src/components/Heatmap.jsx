import React, { useEffect, useState } from 'react';
import websocketService from '../services/websocketService';
import { formatSensorPheromone } from '../utils/dataFormatter';

export default function Heatmap() {
  const [dataMap, setDataMap] = useState({});

  useEffect(() => {
    const unsub = websocketService.subscribe('sensorPheromone', (payload) => {
      const item = formatSensorPheromone(payload);
      setDataMap(prev => ({ ...prev, [item.agentId]: item.metric }));
    });
    return () => unsub();
  }, []);

  const agentIds = Object.keys(dataMap);
  const size = Math.ceil(Math.sqrt(agentIds.length || 1));
  const cells = [];
  for (let i = 0; i < size * size; i++) {
    const agentId = agentIds[i];
    const value = agentId ? dataMap[agentId] : 0;
    const intensity = Math.min(1, value);
    const bgColor = agentId ? `rgba(255, 0, 0, ${intensity})` : '#eee';
    cells.push(
      <div key={i} style={{ backgroundColor: bgColor, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50px' }}>
        {agentId || ''}
      </div>
    );
  }

  return (
    <div>
      <h3>Heatmap</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: '4px' }}>
        {cells}
      </div>
    </div>
  );
}