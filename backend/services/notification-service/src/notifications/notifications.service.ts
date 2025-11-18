import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../database/schemas/notification.schema';
import { NotificationPreference, NotificationPreferenceDocument } from '../database/schemas/notification-preference.schema';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationPreference.name) private preferenceModel: Model<NotificationPreferenceDocument>,
  ) {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
    priority?: string,
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);
    const channels = this.determineChannels(type, preferences);

    for (const channel of channels) {
      await this.createNotification(userId, channel, type, title, message, data, priority);
    }
  }

  private determineChannels(type: string, preferences: NotificationPreference): string[] {
    const channels: string[] = [];

    if (preferences.emailPreferences[type]) {
      channels.push('Email');
    }

    if (preferences.smsPreferences[type]) {
      channels.push('SMS');
    }

    if (preferences.pushPreferences[type]) {
      channels.push('Push');
    }

    if (preferences.inAppPreferences[type]) {
      channels.push('InApp');
    }

    return channels.filter((c) => !preferences.mutedChannels.includes(c));
  }

  private async createNotification(
    userId: string,
    channel: string,
    type: string,
    title: string,
    message: string,
    data: any,
    priority: string = 'Medium',
  ): Promise<void> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      channel,
      type,
      title,
      message,
      data: data || {},
      priority,
      status: 'Pending',
    });

    await notification.save();

    // Process notification immediately
    await this.processNotification(notification);
  }

  private async processNotification(notification: NotificationDocument): Promise<void> {
    try {
      switch (notification.channel) {
        case 'Email':
          await this.sendEmail(notification);
          break;
        case 'SMS':
          await this.sendSMS(notification);
          break;
        case 'Push':
          await this.sendPush(notification);
          break;
        case 'InApp':
          await this.sendInApp(notification);
          break;
      }

      notification.status = 'Sent';
      notification.sentAt = new Date();
      await notification.save();
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      notification.status = 'Failed';
      notification.errorMessage = error.message;
      notification.retryCount += 1;
      await notification.save();
    }
  }

  private async sendEmail(notification: NotificationDocument): Promise<void> {
    // Get user email from user service (placeholder)
    const userEmail = notification.data.email || 'user@example.com';

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@protrader5.com',
      to: userEmail,
      subject: notification.title,
      html: this.generateEmailTemplate(notification),
    });

    notification.recipient = userEmail;
  }

  private generateEmailTemplate(notification: NotificationDocument): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ProTrader5</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
          </div>
          <div class="footer">
            <p>© 2025 ProTrader5. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async sendSMS(notification: NotificationDocument): Promise<void> {
    // Twilio integration placeholder
    const phoneNumber = notification.data.phone || '+1234567890';
    
    // In production, use Twilio SDK
    this.logger.log(`SMS sent to ${phoneNumber}: ${notification.message}`);
    
    notification.recipient = phoneNumber;
  }

  private async sendPush(notification: NotificationDocument): Promise<void> {
    // Firebase Cloud Messaging integration placeholder
    const deviceToken = notification.data.deviceToken || 'device-token';
    
    // In production, use Firebase Admin SDK
    this.logger.log(`Push notification sent to ${deviceToken}: ${notification.message}`);
    
    notification.recipient = deviceToken;
  }

  private async sendInApp(notification: NotificationDocument): Promise<void> {
    // In-app notifications are just stored in DB and retrieved by frontend
    notification.status = 'Delivered';
    notification.deliveredAt = new Date();
  }

  async getNotifications(userId: string, filters?: any): Promise<Notification[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.channel) {
      query.channel = filters.channel;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.unreadOnly) {
      query.readAt = { $exists: false };
    }

    return this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 50)
      .exec();
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { readAt: new Date(), status: 'Read' },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), readAt: { $exists: false } },
      { readAt: new Date(), status: 'Read' },
    );
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await this.notificationModel.findOneAndDelete({
      _id: notificationId,
      userId: new Types.ObjectId(userId),
    });
  }

  async getPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = await this.preferenceModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!preferences) {
      preferences = await this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  private async createDefaultPreferences(userId: string): Promise<NotificationPreference> {
    const preferences = new this.preferenceModel({
      userId: new Types.ObjectId(userId),
    });

    return preferences.save();
  }

  async updatePreferences(userId: string, updates: any): Promise<NotificationPreference> {
    return this.preferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updates },
        { new: true, upsert: true },
      )
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      channel: 'InApp',
      readAt: { $exists: false },
    });
  }
}
