import { Server, Socket } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface OrderUpdate {
  orderId: string;
  userId: string;
  symbol: string;
  type: string;
  side: string;
  quantity: number;
  price?: number;
  status: string;
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice?: number;
  timestamp: number;
}

export class OrderService {
  private io: Server;
  private redisClient: RedisClientType | null = null;
  private subscribedUsers: Set<string> = new Set();

  constructor(io: Server) {
    this.io = io;
  }

  async start(): Promise<void> {
    logger.info('Starting Order Service');

    try {
      // Connect to Redis for pub/sub
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      await this.redisClient.connect();

      // Subscribe to order updates channel
      await this.redisClient.subscribe('order:updates', (message) => {
        try {
          const orderUpdate: OrderUpdate = JSON.parse(message);
          this.handleOrderUpdate(orderUpdate);
        } catch (error) {
          logger.error('Failed to parse order update:', error);
        }
      });

      logger.info('Order Service started and subscribed to Redis channel');
    } catch (error) {
      logger.error('Failed to start Order Service:', error);
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping Order Service');

    if (this.redisClient) {
      await this.redisClient.unsubscribe('order:updates');
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  async subscribe(socket: Socket, userId: string): Promise<void> {
    this.subscribedUsers.add(userId);
    socket.join(`orders:${userId}`);
    logger.info(`User ${userId} subscribed to order updates`);
  }

  async unsubscribe(socket: Socket, userId: string): Promise<void> {
    this.subscribedUsers.delete(userId);
    socket.leave(`orders:${userId}`);
    logger.info(`User ${userId} unsubscribed from order updates`);
  }

  private handleOrderUpdate(orderUpdate: OrderUpdate): void {
    const { userId } = orderUpdate;

    if (this.subscribedUsers.has(userId)) {
      this.io.to(`orders:${userId}`).emit('order:update', orderUpdate);
      logger.info(`Order update sent to user ${userId}: ${orderUpdate.orderId} - ${orderUpdate.status}`);
    }
  }

  // Method to be called by Trading Service to publish order updates
  async publishOrderUpdate(orderUpdate: OrderUpdate): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.publish('order:updates', JSON.stringify(orderUpdate));
    }
  }
}
