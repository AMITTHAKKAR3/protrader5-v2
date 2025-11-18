import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationPreferenceDocument = NotificationPreference & Document;

@Schema({ timestamps: true })
export class NotificationPreference {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: {
      TradeExecution: { type: Boolean, default: true },
      OrderFilled: { type: Boolean, default: true },
      OrderCancelled: { type: Boolean, default: true },
      PriceAlert: { type: Boolean, default: true },
      RiskAlert: { type: Boolean, default: true },
      MarginCall: { type: Boolean, default: true },
      Deposit: { type: Boolean, default: true },
      Withdrawal: { type: Boolean, default: true },
      KYCUpdate: { type: Boolean, default: true },
      SystemAnnouncement: { type: Boolean, default: true },
      StrategyUpdate: { type: Boolean, default: true },
      CopyTradeExecution: { type: Boolean, default: true },
      AlgoTradingAlert: { type: Boolean, default: true },
      General: { type: Boolean, default: true },
    },
    default: {},
  })
  emailPreferences: Record<string, boolean>;

  @Prop({
    type: {
      TradeExecution: { type: Boolean, default: true },
      OrderFilled: { type: Boolean, default: true },
      OrderCancelled: { type: Boolean, default: false },
      PriceAlert: { type: Boolean, default: true },
      RiskAlert: { type: Boolean, default: true },
      MarginCall: { type: Boolean, default: true },
      Deposit: { type: Boolean, default: true },
      Withdrawal: { type: Boolean, default: true },
      KYCUpdate: { type: Boolean, default: false },
      SystemAnnouncement: { type: Boolean, default: false },
      StrategyUpdate: { type: Boolean, default: false },
      CopyTradeExecution: { type: Boolean, default: true },
      AlgoTradingAlert: { type: Boolean, default: true },
      General: { type: Boolean, default: false },
    },
    default: {},
  })
  smsPreferences: Record<string, boolean>;

  @Prop({
    type: {
      TradeExecution: { type: Boolean, default: true },
      OrderFilled: { type: Boolean, default: true },
      OrderCancelled: { type: Boolean, default: true },
      PriceAlert: { type: Boolean, default: true },
      RiskAlert: { type: Boolean, default: true },
      MarginCall: { type: Boolean, default: true },
      Deposit: { type: Boolean, default: true },
      Withdrawal: { type: Boolean, default: true },
      KYCUpdate: { type: Boolean, default: true },
      SystemAnnouncement: { type: Boolean, default: true },
      StrategyUpdate: { type: Boolean, default: true },
      CopyTradeExecution: { type: Boolean, default: true },
      AlgoTradingAlert: { type: Boolean, default: true },
      General: { type: Boolean, default: true },
    },
    default: {},
  })
  pushPreferences: Record<string, boolean>;

  @Prop({
    type: {
      TradeExecution: { type: Boolean, default: true },
      OrderFilled: { type: Boolean, default: true },
      OrderCancelled: { type: Boolean, default: true },
      PriceAlert: { type: Boolean, default: true },
      RiskAlert: { type: Boolean, default: true },
      MarginCall: { type: Boolean, default: true },
      Deposit: { type: Boolean, default: true },
      Withdrawal: { type: Boolean, default: true },
      KYCUpdate: { type: Boolean, default: true },
      SystemAnnouncement: { type: Boolean, default: true },
      StrategyUpdate: { type: Boolean, default: true },
      CopyTradeExecution: { type: Boolean, default: true },
      AlgoTradingAlert: { type: Boolean, default: true },
      General: { type: Boolean, default: true },
    },
    default: {},
  })
  inAppPreferences: Record<string, boolean>;

  @Prop({ type: [String], default: [] })
  mutedChannels: string[];

  @Prop({ default: false })
  doNotDisturb: boolean;

  @Prop({ type: String })
  doNotDisturbStart: string;

  @Prop({ type: String })
  doNotDisturbEnd: string;
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreference);

// Create indexes
NotificationPreferenceSchema.index({ userId: 1 });
