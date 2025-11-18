import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Position, PositionDocument } from '../database/schemas/position.schema';
import { Trade, TradeDocument } from '../database/schemas/trade.schema';
import { OrderType, TradeType, OrderStatus } from '../common/enums/order.enum';

@Injectable()
export class PositionsService {
  constructor(
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
    @InjectModel(Trade.name) private tradeModel: Model<TradeDocument>,
  ) {}

  async getAllPositions(userId: string, isOpen?: boolean): Promise<Position[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (isOpen !== undefined) {
      query.isOpen = isOpen;
    }

    return this.positionModel.find(query).sort({ openedAt: -1 }).exec();
  }

  async getPositionById(userId: string, positionId: string): Promise<Position> {
    const position = await this.positionModel.findOne({
      _id: positionId,
      userId: new Types.ObjectId(userId),
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    return position;
  }

  async closePosition(
    userId: string,
    positionId: string,
    quantity?: number,
  ): Promise<void> {
    const position = await this.getPositionById(userId, positionId);

    if (!position.isOpen) {
      throw new BadRequestException('Position is already closed');
    }

    const closeQuantity = quantity || position.quantity;

    if (closeQuantity > position.quantity) {
      throw new BadRequestException('Close quantity exceeds position quantity');
    }

    // Get current market price
    const currentPrice = await this.getCurrentMarketPrice(position.symbol);

    // Create closing trade
    const closingTrade = new this.tradeModel({
      userId: new Types.ObjectId(userId),
      symbol: position.symbol,
      exchange: position.exchange,
      orderType: OrderType.MARKET,
      tradeType: position.tradeType === TradeType.BUY ? TradeType.SELL : TradeType.BUY,
      productType: 'Intraday',
      quantity: closeQuantity,
      lotSize: 1,
      price: currentPrice,
      averagePrice: currentPrice,
      filledQuantity: closeQuantity,
      status: OrderStatus.EXECUTED,
      executedAt: new Date(),
    });

    await closingTrade.save();

    // Update position
    if (closeQuantity === position.quantity) {
      // Close entire position
      position.isOpen = false;
      position.closedAt = new Date();
      position.currentPrice = currentPrice;
      position.pnl = this.calculatePnL(position, currentPrice);
      position.pnlPercentage = (position.pnl / (position.averagePrice * position.quantity)) * 100;
    } else {
      // Partial close
      position.quantity -= closeQuantity;
    }

    position.relatedTrades.push(closingTrade._id);
    await position.save();
  }

  async closeAllPositions(userId: string): Promise<void> {
    const openPositions = await this.getAllPositions(userId, true);

    for (const position of openPositions) {
      await this.closePosition(userId, position._id.toString());
    }
  }

  async updateStopLossTakeProfit(
    userId: string,
    positionId: string,
    stopLoss?: number,
    takeProfit?: number,
  ): Promise<Position> {
    const position = await this.getPositionById(userId, positionId);

    if (!position.isOpen) {
      throw new BadRequestException('Cannot update closed position');
    }

    const updates: any = {};
    if (stopLoss !== undefined) {
      updates.stopLoss = stopLoss;
    }
    if (takeProfit !== undefined) {
      updates.takeProfit = takeProfit;
    }

    return this.positionModel.findByIdAndUpdate(positionId, updates, { new: true });
  }

  async updatePositionPrices(): Promise<void> {
    // This would be called periodically to update all open positions with current prices
    const openPositions = await this.positionModel.find({ isOpen: true });

    for (const position of openPositions) {
      const currentPrice = await this.getCurrentMarketPrice(position.symbol);
      position.currentPrice = currentPrice;
      position.pnl = this.calculatePnL(position, currentPrice);
      position.pnlPercentage = (position.pnl / (position.averagePrice * position.quantity)) * 100;
      
      // Check stop loss and take profit
      if (position.stopLoss && this.shouldTriggerStopLoss(position, currentPrice)) {
        await this.closePosition(position.userId.toString(), position._id.toString());
      } else if (position.takeProfit && this.shouldTriggerTakeProfit(position, currentPrice)) {
        await this.closePosition(position.userId.toString(), position._id.toString());
      } else {
        await position.save();
      }
    }
  }

  private calculatePnL(position: PositionDocument, currentPrice: number): number {
    const multiplier = position.tradeType === TradeType.BUY ? 1 : -1;
    return (currentPrice - position.averagePrice) * position.quantity * multiplier;
  }

  private shouldTriggerStopLoss(position: PositionDocument, currentPrice: number): boolean {
    if (position.tradeType === TradeType.BUY) {
      return currentPrice <= position.stopLoss;
    } else {
      return currentPrice >= position.stopLoss;
    }
  }

  private shouldTriggerTakeProfit(position: PositionDocument, currentPrice: number): boolean {
    if (position.tradeType === TradeType.BUY) {
      return currentPrice >= position.takeProfit;
    } else {
      return currentPrice <= position.takeProfit;
    }
  }

  private async getCurrentMarketPrice(symbol: string): Promise<number> {
    // In production, fetch from market data service or Redis cache
    return 50000;
  }
}
