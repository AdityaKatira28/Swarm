import React from 'react';
import Heatmap from './components/Heatmap';
import NetworkGraph from './components/NetworkGraph';
import ResponseTimeline from './components/ResponseTimeline';
import ROIStats from './components/ROIStats';
import { triggerAnomaly } from './services/apiService';

function App() {
  const handleManualTrigger = () => {
    const region = prompt('Enter region for manual anomaly:');
    if (region) {
      triggerAnomaly(region).then(res => alert('Triggered anomaly in ' + region));
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h1>Distributed Anomaly Response Swarm Demo</h1>
      <button onClick={handleManualTrigger}>Manual Anomaly Trigger</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div><Heatmap /></div>
        <div><NetworkGraph /></div>
      </div>
      <div style={{ marginTop: '16px' }}><ResponseTimeline /></div>
      <div style={{ marginTop: '16px' }}><ROIStats /></div>
    </div>
  );
}

export default App;