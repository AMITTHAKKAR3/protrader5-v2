import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TradeType, Exchange } from '../../common/enums/order.enum';

export type PositionDocument = Position & Document;

@Schema({ timestamps: true })
export class Position {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  symbol: string;

  @Prop({ type: String, enum: Exchange, required: true })
  exchange: Exchange;

  @Prop({ type: String, enum: TradeType, required: true })
  tradeType: TradeType;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  averagePrice: number;

  @Prop({ required: true })
  currentPrice: number;

  @Prop({ required: true })
  pnl: number;

  @Prop({ required: true })
  pnlPercentage: number;

  @Prop({ required: true })
  margin: number;

  @Prop({ required: true, default: 1 })
  leverage: number;

  @Prop({ required: false })
  stopLoss: number;

  @Prop({ required: false })
  takeProfit: number;

  @Prop({ default: true, index: true })
  isOpen: boolean;

  @Prop({ type: Date, required: true })
  openedAt: Date;

  @Prop({ type: Date })
  closedAt: Date;

  @Prop({ type: [Types.ObjectId], default: [] })
  relatedTrades: Types.ObjectId[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const PositionSchema = SchemaFactory.createForClass(Position);

// Create indexes
PositionSchema.index({ userId: 1, isOpen: 1 });
PositionSchema.index({ symbol: 1, isOpen: 1 });
PositionSchema.index({ userId: 1, symbol: 1, isOpen: 1 }, { unique: true });
