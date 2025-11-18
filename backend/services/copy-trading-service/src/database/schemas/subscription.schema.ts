import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  followerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  strategyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  traderId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Active', 'Paused', 'Cancelled', 'Expired'],
    default: 'Active',
    index: true,
  })
  status: string;

  @Prop({ required: true })
  investmentAmount: number;

  @Prop({ required: true, min: 0, max: 100 })
  copyRatio: number;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Date })
  nextBillingDate: Date;

  @Prop({ default: 0 })
  totalProfitShared: number;

  @Prop({ default: 0 })
  totalFeesPaid: number;

  @Prop({
    type: {
      totalReturn: { type: Number, default: 0 },
      totalPnL: { type: Number, default: 0 },
      openPositions: { type: Number, default: 0 },
      closedPositions: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
    },
  })
  performance: {
    totalReturn: number;
    totalPnL: number;
    openPositions: number;
    closedPositions: number;
    winRate: number;
  };

  @Prop({ type: [Types.ObjectId], default: [] })
  copiedTrades: Types.ObjectId[];

  @Prop({
    type: {
      stopLoss: Boolean,
      takeProfit: Boolean,
      maxDailyLoss: Number,
      maxPositionSize: Number,
    },
  })
  settings: {
    stopLoss: boolean;
    takeProfit: boolean;
    maxDailyLoss: number;
    maxPositionSize: number;
  };

  @Prop({ default: true })
  autoRenew: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Create indexes
SubscriptionSchema.index({ followerId: 1, status: 1 });
SubscriptionSchema.index({ strategyId: 1, status: 1 });
SubscriptionSchema.index({ traderId: 1, status: 1 });
SubscriptionSchema.index({ startDate: -1 });
