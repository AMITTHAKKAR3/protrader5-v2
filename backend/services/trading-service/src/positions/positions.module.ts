import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Position, PositionSchema } from '../database/schemas/position.schema';
import { Trade, TradeSchema } from '../database/schemas/trade.schema';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Position.name, schema: PositionSchema },
      { name: Trade.name, schema: TradeSchema },
    ]),
  ],
  controllers: [PositionsController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}
