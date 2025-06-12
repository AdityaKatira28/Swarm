// frontend/src/services/websocketService.js

class WebsocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxBackoff = 30000;
    this.connect();
  }

  connect() {
    const url = import.meta.env.VITE_WS_URL;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, payload } = msg;
        (this.listeners[type] || []).forEach(cb => cb(payload));
      } catch (err) {
        console.error('WebSocket parse error', err);
      }
    };

    this.ws.onclose = (event) => {
      // Only attempt reconnect on abnormal closure
      if (!event.wasClean) {
        this.reconnectAttempts += 1;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxBackoff);
        console.log(`WebSocket closed, reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => this.connect(), delay);
      } else {
        console.log('WebSocket closed cleanly');
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error', err);
      // Trigger close to initiate reconnection
      try {
        this.ws.close();
      } catch (_) {}
    };
  }

  subscribe(eventType, callback) {
    if (!this.listeners[eventType]) this.listeners[eventType] = [];
    this.listeners[eventType].push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
    };
  }
}

const websocketService = new WebsocketService();
export default websocketService;
