import { Server, Socket } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface PositionUpdate {
  positionId: string;
  userId: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  timestamp: number;
}

export class PositionService {
  private io: Server;
  private redisClient: RedisClientType | null = null;
  private subscribedUsers: Set<string> = new Set();

  constructor(io: Server) {
    this.io = io;
  }

  async start(): Promise<void> {
    logger.info('Starting Position Service');

    try {
      // Connect to Redis for pub/sub
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      await this.redisClient.connect();

      // Subscribe to position updates channel
      await this.redisClient.subscribe('position:updates', (message) => {
        try {
          const positionUpdate: PositionUpdate = JSON.parse(message);
          this.handlePositionUpdate(positionUpdate);
        } catch (error) {
          logger.error('Failed to parse position update:', error);
        }
      });

      logger.info('Position Service started and subscribed to Redis channel');
    } catch (error) {
      logger.error('Failed to start Position Service:', error);
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping Position Service');

    if (this.redisClient) {
      await this.redisClient.unsubscribe('position:updates');
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  async subscribe(socket: Socket, userId: string): Promise<void> {
    this.subscribedUsers.add(userId);
    socket.join(`positions:${userId}`);
    logger.info(`User ${userId} subscribed to position updates`);
  }

  async unsubscribe(socket: Socket, userId: string): Promise<void> {
    this.subscribedUsers.delete(userId);
    socket.leave(`positions:${userId}`);
    logger.info(`User ${userId} unsubscribed from position updates`);
  }

  private handlePositionUpdate(positionUpdate: PositionUpdate): void {
    const { userId } = positionUpdate;

    if (this.subscribedUsers.has(userId)) {
      this.io.to(`positions:${userId}`).emit('position:update', positionUpdate);
      logger.info(`Position update sent to user ${userId}: ${positionUpdate.symbol} P&L: ${positionUpdate.unrealizedPnL}`);
    }
  }

  // Method to be called by Trading Service to publish position updates
  async publishPositionUpdate(positionUpdate: PositionUpdate): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.publish('position:updates', JSON.stringify(positionUpdate));
    }
  }
}
