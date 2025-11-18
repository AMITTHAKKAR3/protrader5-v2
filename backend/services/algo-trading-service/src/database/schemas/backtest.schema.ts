import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BacktestDocument = Backtest & Document;

@Schema({ timestamps: true })
export class Backtest {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  algorithmId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ required: true })
  initialCapital: number;

  @Prop({ required: true })
  finalCapital: number;

  @Prop({
    type: String,
    enum: ['Pending', 'Running', 'Completed', 'Failed'],
    default: 'Pending',
    index: true,
  })
  status: string;

  @Prop({
    type: {
      totalReturn: Number,
      totalReturnPercentage: Number,
      sharpeRatio: Number,
      sortinoRatio: Number,
      maxDrawdown: Number,
      maxDrawdownPercentage: Number,
      winRate: Number,
      profitFactor: Number,
      totalTrades: Number,
      profitableTrades: Number,
      losingTrades: Number,
      averageProfit: Number,
      averageLoss: Number,
      largestWin: Number,
      largestLoss: Number,
      averageHoldingPeriod: Number,
      volatility: Number,
    },
  })
  results: {
    totalReturn: number;
    totalReturnPercentage: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    maxDrawdownPercentage: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    profitableTrades: number;
    losingTrades: number;
    averageProfit: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    averageHoldingPeriod: number;
    volatility: number;
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

  @Prop({
    type: [
      {
        entryDate: Date,
        exitDate: Date,
        symbol: String,
        type: String,
        entryPrice: Number,
        exitPrice: Number,
        quantity: Number,
        pnl: Number,
        pnlPercentage: Number,
      },
    ],
    default: [],
  })
  trades: Array<{
    entryDate: Date;
    exitDate: Date;
    symbol: string;
    type: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    pnl: number;
    pnlPercentage: number;
  }>;

  @Prop({ type: String })
  errorMessage: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const BacktestSchema = SchemaFactory.createForClass(Backtest);

// Create indexes
BacktestSchema.index({ algorithmId: 1, createdAt: -1 });
BacktestSchema.index({ userId: 1, status: 1 });
BacktestSchema.index({ status: 1 });
