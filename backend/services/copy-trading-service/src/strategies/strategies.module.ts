import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Strategy, StrategySchema } from '../database/schemas/strategy.schema';
import { StrategiesService } from './strategies.service';
import { StrategiesController } from './strategies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Strategy.name, schema: StrategySchema }]),
  ],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}
