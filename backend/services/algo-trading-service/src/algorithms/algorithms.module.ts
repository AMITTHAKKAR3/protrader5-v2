import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Algorithm, AlgorithmSchema } from '../database/schemas/algorithm.schema';
import { Backtest, BacktestSchema } from '../database/schemas/backtest.schema';
import { AlgorithmsService } from './algorithms.service';
import { AlgorithmsController } from './algorithms.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Algorithm.name, schema: AlgorithmSchema },
      { name: Backtest.name, schema: BacktestSchema },
    ]),
  ],
  controllers: [AlgorithmsController],
  providers: [AlgorithmsService],
  exports: [AlgorithmsService],
})
export class AlgorithmsModule {}
