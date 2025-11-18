import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChartTemplateDocument = ChartTemplate & Document;

@Schema({ timestamps: true })
export class ChartTemplate {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({
    type: [
      {
        name: String,
        type: String,
        params: Object,
        color: String,
        lineWidth: Number,
      },
    ],
    default: [],
  })
  indicators: Array<{
    name: string;
    type: string;
    params: Record<string, any>;
    color: string;
    lineWidth: number;
  }>;

  @Prop({
    type: [
      {
        type: String,
        points: Array,
        color: String,
        lineWidth: Number,
        style: String,
      },
    ],
    default: [],
  })
  drawings: Array<{
    type: string;
    points: any[];
    color: string;
    lineWidth: number;
    style: string;
  }>;

  @Prop({
    type: {
      chartType: String,
      backgroundColor: String,
      gridColor: String,
      textColor: String,
      candleUpColor: String,
      candleDownColor: String,
    },
  })
  layout: {
    chartType: string;
    backgroundColor: string;
    gridColor: string;
    textColor: string;
    candleUpColor: string;
    candleDownColor: string;
  };

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: false })
  isPublic: boolean;
}

export const ChartTemplateSchema = SchemaFactory.createForClass(ChartTemplate);

// Create indexes
ChartTemplateSchema.index({ userId: 1, name: 1 });
ChartTemplateSchema.index({ isPublic: 1 });
