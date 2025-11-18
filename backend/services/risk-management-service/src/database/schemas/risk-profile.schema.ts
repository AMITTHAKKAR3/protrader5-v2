import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RiskProfileDocument = RiskProfile & Document;

@Schema({ timestamps: true })
export class RiskProfile {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  maxDailyLoss: number;

  @Prop({ required: true })
  maxDailyLossPercentage: number;

  @Prop({ required: true })
  maxPositionSize: number;

  @Prop({ required: true })
  maxPositionSizePercentage: number;

  @Prop({ required: true })
  maxOpenPositions: number;

  @Prop({ required: true, min: 1, max: 100 })
  maxLeverage: number;

  @Prop({ required: true })
  maxDrawdown: number;

  @Prop({ required: true })
  maxDrawdownPercentage: number;

  @Prop({ type: [String], default: [] })
  allowedExchanges: string[];

  @Prop({ type: [String], default: [] })
  restrictedSymbols: string[];

  @Prop({ type: [String], default: [] })
  allowedSymbols: string[];

  @Prop({ default: true })
  requireStopLoss: boolean;

  @Prop({ default: false })
  allowMarginTrading: boolean;

  @Prop({ default: false })
  allowOptionsTrading: boolean;

  @Prop({ default: false })
  allowFuturesTrading: boolean;

  @Prop({
    type: {
      currentDailyLoss: { type: Number, default: 0 },
      currentDrawdown: { type: Number, default: 0 },
      openPositionsCount: { type: Number, default: 0 },
      totalExposure: { type: Number, default: 0 },
      marginUsed: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
  })
  currentStatus: {
    currentDailyLoss: number;
    currentDrawdown: number;
    openPositionsCount: number;
    totalExposure: number;
    marginUsed: number;
    lastUpdated: Date;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const RiskProfileSchema = SchemaFactory.createForClass(RiskProfile);

// Create indexes
RiskProfileSchema.index({ userId: 1 });
RiskProfileSchema.index({ isActive: 1 });
