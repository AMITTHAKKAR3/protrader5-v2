import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('accessToken');

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to market data
  subscribeToMarketData(symbols: string[], callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.emit('subscribe:market', { symbols });
    this.socket?.on('market:data', callback);
  }

  unsubscribeFromMarketData(symbols: string[]): void {
    this.socket?.emit('unsubscribe:market', { symbols });
    this.socket?.off('market:data');
  }

  // Subscribe to order updates
  subscribeToOrders(callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('order:update', callback);
  }

  unsubscribeFromOrders(): void {
    this.socket?.off('order:update');
  }

  // Subscribe to position updates
  subscribeToPositions(callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('position:update', callback);
  }

  unsubscribeFromPositions(): void {
    this.socket?.off('position:update');
  }

  // Subscribe to notifications
  subscribeToNotifications(callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on('notification', callback);
  }

  unsubscribeFromNotifications(): void {
    this.socket?.off('notification');
  }

  // Send custom event
  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  // Listen to custom event
  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  // Remove custom event listener
  off(event: string): void {
    this.socket?.off(event);
  }
}

export default new WebSocketService();
