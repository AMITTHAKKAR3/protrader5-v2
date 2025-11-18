import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StrategyDocument = Strategy & Document;

@Schema({ timestamps: true })
export class Strategy {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  traderId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: String,
    enum: ['Public', 'Private', 'Invite-Only'],
    default: 'Public',
  })
  visibility: string;

  @Prop({
    type: String,
    enum: ['Active', 'Paused', 'Closed'],
    default: 'Active',
    index: true,
  })
  status: string;

  @Prop({ required: true })
  subscriptionFee: number;

  @Prop({
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly', 'One-Time'],
    default: 'Monthly',
  })
  feeType: string;

  @Prop({ required: true, min: 0, max: 100 })
  profitSharingPercentage: number;

  @Prop({ required: true })
  minInvestment: number;

  @Prop({ required: false })
  maxInvestment: number;

  @Prop({ default: 0 })
  maxSubscribers: number;

  @Prop({ default: 0 })
  currentSubscribers: number;

  @Prop({
    type: {
      totalReturn: { type: Number, default: 0 },
      monthlyReturn: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      sharpeRatio: { type: Number, default: 0 },
      maxDrawdown: { type: Number, default: 0 },
      totalTrades: { type: Number, default: 0 },
      profitableTrades: { type: Number, default: 0 },
      averageProfit: { type: Number, default: 0 },
      averageLoss: { type: Number, default: 0 },
    },
  })
  performance: {
    totalReturn: number;
    monthlyReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
    profitableTrades: number;
    averageProfit: number;
    averageLoss: number;
  };

  @Prop({
    type: [
      {
        date: Date,
        value: Number,
      },
    ],
    default: [],
  })
  equityCurve: Array<{
    date: Date;
    value: number;
  }>;

  @Prop({ type: [String], default: [] })
  allowedSymbols: string[];

  @Prop({ type: [String], default: [] })
  allowedExchanges: string[];

  @Prop({
    type: {
      maxPositionSize: Number,
      maxDailyLoss: Number,
      maxOpenPositions: Number,
      stopLossRequired: Boolean,
    },
  })
  riskManagement: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
    stopLossRequired: boolean;
  };

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const StrategySchema = SchemaFactory.createForClass(Strategy);

// Create indexes
StrategySchema.index({ traderId: 1, status: 1 });
StrategySchema.index({ status: 1, rating: -1 });
StrategySchema.index({ tags: 1 });
StrategySchema.index({ 'performance.totalReturn': -1 });
