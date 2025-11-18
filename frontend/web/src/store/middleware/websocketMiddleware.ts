import { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { updateMarketData, setConnectionStatus } from '../slices/marketSlice';
import { updateOrder } from '../slices/tradingSlice';
import { updatePosition } from '../slices/positionSlice';
import { addNotification } from '../slices/notificationSlice';

let socket: Socket | null = null;

export const websocketMiddleware: Middleware = (store) => (next) => (action) => {
  const { type, payload } = action;

  // Initialize WebSocket connection
  if (type === 'auth/login/fulfilled' || type === 'auth/setCredentials') {
    const token = payload.token;
    
    if (socket) {
      socket.disconnect();
    }

    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:4000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      store.dispatch(setConnectionStatus(true));
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      store.dispatch(setConnectionStatus(false));
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Market data events
    socket.on('market:data', (data) => {
      store.dispatch(updateMarketData(data));
    });

    // Order update events
    socket.on('order:update', (order) => {
      store.dispatch(updateOrder(order));
      
      // Show notification for important order events
      if (['FILLED', 'CANCELLED', 'REJECTED'].includes(order.status)) {
        store.dispatch(addNotification({
          id: `order-${order.id}-${Date.now()}`,
          type: 'ORDER_UPDATE',
          title: `Order ${order.status}`,
          message: `${order.side} ${order.quantity} ${order.symbol} @ ${order.averagePrice || order.price}`,
          priority: 'MEDIUM',
          read: false,
          timestamp: Date.now(),
        }));
      }
    });

    // Position update events
    socket.on('position:update', (position) => {
      store.dispatch(updatePosition(position));
    });

    // Notification events
    socket.on('notification', (notification) => {
      store.dispatch(addNotification(notification));
    });

    // Subscribe to initial data
    socket.emit('subscribe:orders');
    socket.emit('subscribe:positions');
    socket.emit('subscribe:notifications');
  }

  // Disconnect WebSocket on logout
  if (type === 'auth/logout/fulfilled' || type === 'auth/clearCredentials') {
    if (socket) {
      socket.disconnect();
      socket = null;
      store.dispatch(setConnectionStatus(false));
    }
  }

  // Subscribe to market data
  if (type === 'market/subscribeToSymbols') {
    if (socket && socket.connected) {
      socket.emit('subscribe:market', { symbols: payload });
    }
  }

  // Unsubscribe from market data
  if (type === 'market/unsubscribeFromSymbols') {
    if (socket && socket.connected) {
      socket.emit('unsubscribe:market', { symbols: payload });
    }
  }

  return next(action);
};
