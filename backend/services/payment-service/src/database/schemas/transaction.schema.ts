import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Deposit', 'Withdrawal', 'Subscription', 'Commission', 'Refund'],
    required: true,
    index: true,
  })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
    default: 'Pending',
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    enum: ['Razorpay', 'Stripe', 'BankTransfer', 'UPI', 'Wallet'],
    required: true,
  })
  paymentMethod: string;

  @Prop({ type: String, unique: true, sparse: true })
  paymentId: string;

  @Prop({ type: String })
  orderId: string;

  @Prop({ type: String })
  signature: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: String })
  failureReason: string;

  @Prop({ type: Number, default: 0 })
  fee: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ required: true })
  netAmount: number;

  @Prop({ type: String })
  bankReference: string;

  @Prop({ type: String })
  receiptUrl: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Create indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, type: 1 });
TransactionSchema.index({ paymentId: 1 });
TransactionSchema.index({ orderId: 1 });
