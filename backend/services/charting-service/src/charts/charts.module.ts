import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChartData, ChartDataSchema } from '../database/schemas/chart-data.schema';
import { ChartTemplate, ChartTemplateSchema } from '../database/schemas/chart-template.schema';
import { ChartsService } from './charts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChartData.name, schema: ChartDataSchema },
      { name: ChartTemplate.name, schema: ChartTemplateSchema },
    ]),
  ],
  providers: [ChartsService],
  exports: [ChartsService],
})
export class ChartsModule {}
