import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Email', 'SMS', 'Push', 'InApp'],
    required: true,
    index: true,
  })
  channel: string;

  @Prop({
    type: String,
    enum: [
      'TradeExecution',
      'OrderFilled',
      'OrderCancelled',
      'PriceAlert',
      'RiskAlert',
      'MarginCall',
      'Deposit',
      'Withdrawal',
      'KYCUpdate',
      'SystemAnnouncement',
      'StrategyUpdate',
      'CopyTradeExecution',
      'AlgoTradingAlert',
      'General',
    ],
    required: true,
    index: true,
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({
    type: String,
    enum: ['Pending', 'Sent', 'Failed', 'Delivered', 'Read'],
    default: 'Pending',
    index: true,
  })
  status: string;

  @Prop({ type: String })
  recipient: string;

  @Prop({ type: Date })
  sentAt: Date;

  @Prop({ type: Date })
  deliveredAt: Date;

  @Prop({ type: Date })
  readAt: Date;

  @Prop({ type: String })
  errorMessage: string;

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  @Prop({ type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' })
  priority: string;

  @Prop({ type: Date })
  expiresAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create indexes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, priority: -1 });
NotificationSchema.index({ type: 1, channel: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
