import { Server, Socket } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  read: boolean;
  timestamp: number;
  metadata?: any;
}

export class NotificationService {
  private io: Server;
  private redisClient: RedisClientType | null = null;
  private subscribedUsers: Set<string> = new Set();

  constructor(io: Server) {
    this.io = io;
  }

  async start(): Promise<void> {
    logger.info('Starting Notification Service');

    try {
      // Connect to Redis for pub/sub
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      await this.redisClient.connect();

      // Subscribe to notifications channel
      await this.redisClient.subscribe('notifications', (message) => {
        try {
          const notification: Notification = JSON.parse(message);
          this.handleNotification(notification);
        } catch (error) {
          logger.error('Failed to parse notification:', error);
        }
      });

      logger.info('Notification Service started and subscribed to Redis channel');
    } catch (error) {
      logger.error('Failed to start Notification Service:', error);
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping Notification Service');

    if (this.redisClient) {
      await this.redisClient.unsubscribe('notifications');
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  async subscribe(socket: Socket, userId: string): Promise<void> {
    this.subscribedUsers.add(userId);
    socket.join(`notifications:${userId}`);
    logger.info(`User ${userId} subscribed to notifications`);
  }

  async unsubscribe(socket: Socket, userId: string): Promise<void> {
    this.subscribedUsers.delete(userId);
    socket.leave(`notifications:${userId}`);
    logger.info(`User ${userId} unsubscribed from notifications`);
  }

  private handleNotification(notification: Notification): void {
    const { userId } = notification;

    if (this.subscribedUsers.has(userId)) {
      this.io.to(`notifications:${userId}`).emit('notification', notification);
      logger.info(`Notification sent to user ${userId}: ${notification.type} - ${notification.title}`);
    }
  }

  // Method to be called by Notification Service to publish notifications
  async publishNotification(notification: Notification): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.publish('notifications', JSON.stringify(notification));
    }
  }
}
