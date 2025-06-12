import React, { useEffect, useState } from 'react';
import websocketService from '../services/websocketService';
import { formatResponseEvent } from '../utils/dataFormatter';

export default function ResponseTimeline() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsubStart = websocketService.subscribe('responseStart', (payload) => {
      const evt = formatResponseEvent('start', payload);
      setEvents(prev => [...prev, evt]);
    });
    const unsubComplete = websocketService.subscribe('responseComplete', (payload) => {
      const evt = formatResponseEvent('complete', payload);
      setEvents(prev => [...prev, evt]);
    });
    return () => { unsubStart(); unsubComplete(); };
  }, []);

  return (
    <div>
      <h3>Response Timeline</h3>
      <ul>
        {events.map((evt, idx) => (
          <li key={idx}>
            [{new Date(evt.timestamp).toLocaleTimeString()}] Agent {evt.agentId} {evt.type === 'start' ? 'started response' : 'completed response'} for alert {evt.alertId}
          </li>
        ))}
      </ul>
    </div>
  );
}