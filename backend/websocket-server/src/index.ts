import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { authMiddleware } from './middleware/auth.middleware';
import { MarketDataService } from './services/market-data.service';
import { OrderService } from './services/order.service';
import { PositionService } from './services/position.service';
import { NotificationService } from './services/notification.service';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Redis adapter for horizontal scaling
const setupRedisAdapter = async () => {
  try {
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Redis adapter configured successfully');
  } catch (error) {
    logger.error('Failed to configure Redis adapter:', error);
  }
};

// Initialize services
const marketDataService = new MarketDataService(io);
const orderService = new OrderService(io);
const positionService = new PositionService(io);
const notificationService = new NotificationService(io);

// Authentication middleware
io.use(authMiddleware);

// Connection handler
io.on('connection', (socket: Socket) => {
  const userId = (socket as any).userId;
  logger.info(`User connected: ${userId} (Socket ID: ${socket.id})`);

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Market data events
  socket.on('subscribe:market', async (data: { symbols: string[] }) => {
    try {
      await marketDataService.subscribe(socket, data.symbols);
      logger.info(`User ${userId} subscribed to market data: ${data.symbols.join(', ')}`);
    } catch (error) {
      logger.error(`Market subscription error for user ${userId}:`, error);
      socket.emit('error', { message: 'Failed to subscribe to market data' });
    }
  });

  socket.on('unsubscribe:market', async (data: { symbols: string[] }) => {
    try {
      await marketDataService.unsubscribe(socket, data.symbols);
      logger.info(`User ${userId} unsubscribed from market data: ${data.symbols.join(', ')}`);
    } catch (error) {
      logger.error(`Market unsubscription error for user ${userId}:`, error);
    }
  });

  // Order events
  socket.on('subscribe:orders', async () => {
    try {
      await orderService.subscribe(socket, userId);
      logger.info(`User ${userId} subscribed to order updates`);
    } catch (error) {
      logger.error(`Order subscription error for user ${userId}:`, error);
      socket.emit('error', { message: 'Failed to subscribe to order updates' });
    }
  });

  socket.on('unsubscribe:orders', async () => {
    try {
      await orderService.unsubscribe(socket, userId);
      logger.info(`User ${userId} unsubscribed from order updates`);
    } catch (error) {
      logger.error(`Order unsubscription error for user ${userId}:`, error);
    }
  });

  // Position events
  socket.on('subscribe:positions', async () => {
    try {
      await positionService.subscribe(socket, userId);
      logger.info(`User ${userId} subscribed to position updates`);
    } catch (error) {
      logger.error(`Position subscription error for user ${userId}:`, error);
      socket.emit('error', { message: 'Failed to subscribe to position updates' });
    }
  });

  socket.on('unsubscribe:positions', async () => {
    try {
      await positionService.unsubscribe(socket, userId);
      logger.info(`User ${userId} unsubscribed from position updates`);
    } catch (error) {
      logger.error(`Position unsubscription error for user ${userId}:`, error);
    }
  });

  // Notification events
  socket.on('subscribe:notifications', async () => {
    try {
      await notificationService.subscribe(socket, userId);
      logger.info(`User ${userId} subscribed to notifications`);
    } catch (error) {
      logger.error(`Notification subscription error for user ${userId}:`, error);
      socket.emit('error', { message: 'Failed to subscribe to notifications' });
    }
  });

  socket.on('unsubscribe:notifications', async () => {
    try {
      await notificationService.unsubscribe(socket, userId);
      logger.info(`User ${userId} unsubscribed from notifications`);
    } catch (error) {
      logger.error(`Notification unsubscription error for user ${userId}:`, error);
    }
  });

  // Disconnect handler
  socket.on('disconnect', (reason) => {
    logger.info(`User disconnected: ${userId} (Reason: ${reason})`);
  });

  // Error handler
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${userId}:`, error);
  });
});

// Start server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await setupRedisAdapter();

    httpServer.listen(PORT, () => {
      logger.info(`WebSocket server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start services
    await marketDataService.start();
    await orderService.start();
    await positionService.start();
    await notificationService.start();

    logger.info('All services started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  await marketDataService.stop();
  await orderService.stop();
  await positionService.stop();
  await notificationService.stop();

  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

startServer();
