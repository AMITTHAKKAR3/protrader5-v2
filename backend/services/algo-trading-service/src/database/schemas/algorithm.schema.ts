import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlgorithmDocument = Algorithm & Document;

@Schema({ timestamps: true })
export class Algorithm {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    enum: ['Draft', 'Testing', 'Live', 'Paused', 'Stopped'],
    default: 'Draft',
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    enum: ['Momentum', 'Mean Reversion', 'Breakout', 'Arbitrage', 'Market Making', 'Custom'],
    required: true,
  })
  strategyType: string;

  @Prop({ type: [String], default: [] })
  symbols: string[];

  @Prop({ type: [String], default: [] })
  exchanges: string[];

  @Prop({
    type: String,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
    required: true,
  })
  timeframe: string;

  @Prop({ type: Object, required: true })
  entryConditions: {
    indicators: Array<{
      name: string;
      params: Record<string, any>;
      condition: string;
      value: number;
    }>;
    logic: string; // 'AND' or 'OR'
  };

  @Prop({ type: Object, required: true })
  exitConditions: {
    indicators: Array<{
      name: string;
      params: Record<string, any>;
      condition: string;
      value: number;
    }>;
    logic: string;
    stopLoss: number;
    takeProfit: number;
    trailingStop: boolean;
  };

  @Prop({
    type: {
      maxPositionSize: Number,
      maxOpenPositions: Number,
      maxDailyLoss: Number,
      maxDrawdown: Number,
    },
  })
  riskManagement: {
    maxPositionSize: number;
    maxOpenPositions: number;
    maxDailyLoss: number;
    maxDrawdown: number;
  };

  @Prop({ type: Object, default: {} })
  backtestResults: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    profitableTrades: number;
    averageProfit: number;
    averageLoss: number;
    profitFactor: number;
  };

  @Prop({
    type: {
      startDate: Date,
      endDate: Date,
      initialCapital: Number,
      currentCapital: Number,
      totalTrades: Number,
      profitableTrades: Number,
      totalPnL: Number,
    },
  })
  livePerformance: {
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    currentCapital: number;
    totalTrades: number;
    profitableTrades: number;
    totalPnL: number;
  };

  @Prop({ type: String })
  code: string; // Custom code for advanced users

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: 0 })
  subscribers: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AlgorithmSchema = SchemaFactory.createForClass(Algorithm);

// Create indexes
AlgorithmSchema.index({ userId: 1, status: 1 });
AlgorithmSchema.index({ status: 1, isPublic: 1 });
AlgorithmSchema.index({ strategyType: 1 });
AlgorithmSchema.index({ 'backtestResults.totalReturn': -1 });
