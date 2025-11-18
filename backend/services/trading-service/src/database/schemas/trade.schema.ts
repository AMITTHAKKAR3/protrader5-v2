import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderType, TradeType, ProductType, OrderStatus, ExecutionMode, Exchange } from '../../common/enums/order.enum';

export type TradeDocument = Trade & Document;

@Schema({ timestamps: true })
export class Trade {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  symbol: string;

  @Prop({ type: String, enum: Exchange, required: true })
  exchange: Exchange;

  @Prop({ type: String, enum: OrderType, required: true })
  orderType: OrderType;

  @Prop({ type: String, enum: TradeType, required: true })
  tradeType: TradeType;

  @Prop({ type: String, enum: ProductType, required: true })
  productType: ProductType;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  lotSize: number;

  @Prop({ required: false })
  price: number;

  @Prop({ required: false })
  stopLoss: number;

  @Prop({ required: false })
  takeProfit: number;

  @Prop({ required: false })
  trailingDistance: number;

  @Prop({ required: false })
  trailingStopPrice: number;

  @Prop({ type: String, enum: ExecutionMode, default: ExecutionMode.GTC })
  executionMode: ExecutionMode;

  @Prop({ type: Date })
  expiryDate: Date;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status: OrderStatus;

  @Prop({ default: 0 })
  filledQuantity: number;

  @Prop({ required: false })
  averagePrice: number;

  @Prop({ default: 0 })
  commission: number;

  @Prop({ default: 0 })
  slippage: number;

  @Prop({ type: Types.ObjectId, required: false })
  parentOrderId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], default: [] })
  childOrderIds: Types.ObjectId[];

  // For Iceberg orders
  @Prop({ required: false })
  displayQuantity: number;

  // For TWAP/VWAP orders
  @Prop({ required: false })
  executionDuration: number; // in minutes

  @Prop({ required: false })
  intervalDuration: number; // in seconds

  // For Bracket orders
  @Prop({
    type: {
      entryPrice: Number,
      targetPrice: Number,
      stopLossPrice: Number,
      trailingStop: Boolean,
    },
    required: false,
  })
  bracketOrder: {
    entryPrice: number;
    targetPrice: number;
    stopLossPrice: number;
    trailingStop: boolean;
  };

  @Prop({ type: Date })
  executedAt: Date;

  @Prop({ required: false })
  rejectionReason: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);

// Create indexes
TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ symbol: 1, status: 1 });
TradeSchema.index({ status: 1, createdAt: -1 });
TradeSchema.index({ parentOrderId: 1 });
