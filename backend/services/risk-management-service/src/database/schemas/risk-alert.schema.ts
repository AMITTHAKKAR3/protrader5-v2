import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RiskAlertDocument = RiskAlert & Document;

@Schema({ timestamps: true })
export class RiskAlert {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'DailyLossLimit',
      'PositionSizeLimit',
      'MaxPositionsLimit',
      'DrawdownLimit',
      'MarginCall',
      'LeverageLimit',
      'RestrictedSymbol',
      'ExposureLimit',
    ],
    required: true,
    index: true,
  })
  type: string;

  @Prop({
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    index: true,
  })
  severity: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;

  @Prop({ required: true })
  triggeredAt: Date;

  @Prop({ default: false, index: true })
  acknowledged: boolean;

  @Prop({ type: Date })
  acknowledgedAt: Date;

  @Prop({ type: String })
  acknowledgedBy: string;

  @Prop({ default: false })
  resolved: boolean;

  @Prop({ type: Date })
  resolvedAt: Date;

  @Prop({ type: String })
  resolution: string;
}

export const RiskAlertSchema = SchemaFactory.createForClass(RiskAlert);

// Create indexes
RiskAlertSchema.index({ userId: 1, triggeredAt: -1 });
RiskAlertSchema.index({ type: 1, severity: 1 });
RiskAlertSchema.index({ acknowledged: 1, resolved: 1 });
