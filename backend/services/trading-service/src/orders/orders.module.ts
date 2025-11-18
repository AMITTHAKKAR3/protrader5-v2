import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trade, TradeSchema } from '../database/schemas/trade.schema';
import { Position, PositionSchema } from '../database/schemas/position.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
