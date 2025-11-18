import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChartDataDocument = ChartData & Document;

@Schema({ timestamps: true })
export class ChartData {
  @Prop({ required: true, index: true })
  symbol: string;

  @Prop({ required: true, index: true })
  exchange: string;

  @Prop({
    type: String,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
    required: true,
    index: true,
  })
  timeframe: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true })
  open: number;

  @Prop({ required: true })
  high: number;

  @Prop({ required: true })
  low: number;

  @Prop({ required: true })
  close: number;

  @Prop({ required: true })
  volume: number;

  @Prop({ type: Object, default: {} })
  indicators: Record<string, any>;
}

export const ChartDataSchema = SchemaFactory.createForClass(ChartData);

// Create compound indexes for efficient queries
ChartDataSchema.index({ symbol: 1, exchange: 1, timeframe: 1, timestamp: -1 });
ChartDataSchema.index({ timestamp: -1 });
