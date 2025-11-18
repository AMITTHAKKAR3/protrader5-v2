import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trade, TradeDocument } from '../database/schemas/trade.schema';
import { Position, PositionDocument } from '../database/schemas/position.schema';
import { PlaceOrderDto } from './dto/place-order.dto';
import { OrderType, OrderStatus, TradeType, ExecutionMode } from '../common/enums/order.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Trade.name) private tradeModel: Model<TradeDocument>,
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
  ) {}

  async placeOrder(userId: string, placeOrderDto: PlaceOrderDto): Promise<Trade> {
    // Validate order parameters
    await this.validateOrder(placeOrderDto);

    // Create base trade object
    const trade = new this.tradeModel({
      userId: new Types.ObjectId(userId),
      ...placeOrderDto,
      status: OrderStatus.PENDING,
    });

    // Handle different order types
    switch (placeOrderDto.orderType) {
      case OrderType.MARKET:
        return this.executeMarketOrder(trade);
      
      case OrderType.LIMIT:
        return this.placeLimitOrder(trade);
      
      case OrderType.STOP_LOSS:
      case OrderType.STOP_LIMIT:
        return this.placeStopOrder(trade);
      
      case OrderType.TRAILING_STOP:
        return this.placeTrailingStopOrder(trade);
      
      case OrderType.OCO:
        return this.placeOCOOrder(trade);
      
      case OrderType.ICEBERG:
        return this.placeIcebergOrder(trade);
      
      case OrderType.TWAP:
      case OrderType.VWAP:
        return this.placeAlgorithmicOrder(trade);
      
      case OrderType.BRACKET:
        return this.placeBracketOrder(trade);
      
      default:
        throw new BadRequestException('Unsupported order type');
    }
  }

  async getAllOrders(userId: string, filters?: any): Promise<Trade[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.symbol) {
      query.symbol = filters.symbol;
    }
    if (filters?.orderType) {
      query.orderType = filters.orderType;
    }

    return this.tradeModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .exec();
  }

  async getOrderById(userId: string, orderId: string): Promise<Trade> {
    const order = await this.tradeModel.findOne({
      _id: orderId,
      userId: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async modifyOrder(userId: string, orderId: string, updates: Partial<PlaceOrderDto>): Promise<Trade> {
    const order = await this.getOrderById(userId, orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only modify pending orders');
    }

    // Update allowed fields
    const allowedUpdates = ['price', 'quantity', 'stopLoss', 'takeProfit', 'trailingDistance'];
    const updateData: any = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    return this.tradeModel.findByIdAndUpdate(orderId, updateData, { new: true });
  }

  async cancelOrder(userId: string, orderId: string): Promise<void> {
    const order = await this.getOrderById(userId, orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending orders');
    }

    // If it's a parent order (OCO, Bracket), cancel child orders too
    if (order.childOrderIds && order.childOrderIds.length > 0) {
      await this.tradeModel.updateMany(
        { _id: { $in: order.childOrderIds } },
        { status: OrderStatus.CANCELLED },
      );
    }

    await this.tradeModel.findByIdAndUpdate(orderId, { status: OrderStatus.CANCELLED });
  }

  // Private methods for different order types

  private async executeMarketOrder(trade: TradeDocument): Promise<Trade> {
    // In production, this would get the current market price from market data service
    const currentPrice = await this.getCurrentMarketPrice(trade.symbol);
    
    trade.price = currentPrice;
    trade.averagePrice = currentPrice;
    trade.filledQuantity = trade.quantity;
    trade.status = OrderStatus.EXECUTED;
    trade.executedAt = new Date();

    await trade.save();

    // Update or create position
    await this.updatePosition(trade);

    // Publish trade event (would integrate with Kafka/RabbitMQ)
    await this.publishTradeEvent(trade);

    return trade;
  }

  private async placeLimitOrder(trade: TradeDocument): Promise<Trade> {
    if (!trade.price) {
      throw new BadRequestException('Limit order requires a price');
    }

    await trade.save();

    // In production, this would be monitored by a separate service
    // that checks market prices and executes when conditions are met
    return trade;
  }

  private async placeStopOrder(trade: TradeDocument): Promise<Trade> {
    if (!trade.stopLoss) {
      throw new BadRequestException('Stop order requires a stop loss price');
    }

    await trade.save();
    return trade;
  }

  private async placeTrailingStopOrder(trade: TradeDocument): Promise<Trade> {
    if (!trade.trailingDistance) {
      throw new BadRequestException('Trailing stop order requires a trailing distance');
    }

    // Calculate initial trailing stop price
    const currentPrice = await this.getCurrentMarketPrice(trade.symbol);
    trade.trailingStopPrice = trade.tradeType === TradeType.BUY
      ? currentPrice - trade.trailingDistance
      : currentPrice + trade.trailingDistance;

    await trade.save();
    return trade;
  }

  private async placeOCOOrder(trade: TradeDocument): Promise<Trade> {
    // OCO order consists of two orders: a limit order and a stop order
    if (!trade.price || !trade.stopLoss) {
      throw new BadRequestException('OCO order requires both price and stop loss');
    }

    // Save parent order
    await trade.save();

    // Create two child orders
    const limitOrder = new this.tradeModel({
      ...trade.toObject(),
      _id: new Types.ObjectId(),
      orderType: OrderType.LIMIT,
      parentOrderId: trade._id,
    });

    const stopOrder = new this.tradeModel({
      ...trade.toObject(),
      _id: new Types.ObjectId(),
      orderType: OrderType.STOP_LOSS,
      price: trade.stopLoss,
      parentOrderId: trade._id,
    });

    await Promise.all([limitOrder.save(), stopOrder.save()]);

    trade.childOrderIds = [limitOrder._id, stopOrder._id];
    await trade.save();

    return trade;
  }

  private async placeIcebergOrder(trade: TradeDocument): Promise<Trade> {
    if (!trade.displayQuantity || trade.displayQuantity >= trade.quantity) {
      throw new BadRequestException('Iceberg order requires valid display quantity');
    }

    await trade.save();
    return trade;
  }

  private async placeAlgorithmicOrder(trade: TradeDocument): Promise<Trade> {
    if (!trade.executionDuration || !trade.intervalDuration) {
      throw new BadRequestException('Algorithmic order requires execution and interval duration');
    }

    await trade.save();
    return trade;
  }

  private async placeBracketOrder(trade: TradeDocument): Promise<Trade> {
    if (!trade.bracketOrder) {
      throw new BadRequestException('Bracket order requires bracket order parameters');
    }

    // Save parent order
    await trade.save();

    // Create entry, target, and stop loss orders
    const entryOrder = new this.tradeModel({
      ...trade.toObject(),
      _id: new Types.ObjectId(),
      orderType: OrderType.LIMIT,
      price: trade.bracketOrder.entryPrice,
      parentOrderId: trade._id,
    });

    const targetOrder = new this.tradeModel({
      ...trade.toObject(),
      _id: new Types.ObjectId(),
      orderType: OrderType.LIMIT,
      price: trade.bracketOrder.targetPrice,
      tradeType: trade.tradeType === TradeType.BUY ? TradeType.SELL : TradeType.BUY,
      parentOrderId: trade._id,
    });

    const stopLossOrder = new this.tradeModel({
      ...trade.toObject(),
      _id: new Types.ObjectId(),
      orderType: OrderType.STOP_LOSS,
      price: trade.bracketOrder.stopLossPrice,
      tradeType: trade.tradeType === TradeType.BUY ? TradeType.SELL : TradeType.BUY,
      parentOrderId: trade._id,
    });

    await Promise.all([entryOrder.save(), targetOrder.save(), stopLossOrder.save()]);

    trade.childOrderIds = [entryOrder._id, targetOrder._id, stopLossOrder._id];
    await trade.save();

    return trade;
  }

  private async updatePosition(trade: TradeDocument): Promise<void> {
    const existingPosition = await this.positionModel.findOne({
      userId: trade.userId,
      symbol: trade.symbol,
      isOpen: true,
    });

    if (existingPosition) {
      // Update existing position
      if (existingPosition.tradeType === trade.tradeType) {
        // Add to position
        const totalQuantity = existingPosition.quantity + trade.quantity;
        const totalCost = (existingPosition.averagePrice * existingPosition.quantity) + (trade.price * trade.quantity);
        existingPosition.averagePrice = totalCost / totalQuantity;
        existingPosition.quantity = totalQuantity;
      } else {
        // Reduce or close position
        if (trade.quantity >= existingPosition.quantity) {
          // Close position
          existingPosition.isOpen = false;
          existingPosition.closedAt = new Date();
        } else {
          // Reduce position
          existingPosition.quantity -= trade.quantity;
        }
      }

      existingPosition.relatedTrades.push(trade._id);
      await existingPosition.save();
    } else {
      // Create new position
      const newPosition = new this.positionModel({
        userId: trade.userId,
        symbol: trade.symbol,
        exchange: trade.exchange,
        tradeType: trade.tradeType,
        quantity: trade.quantity,
        averagePrice: trade.price,
        currentPrice: trade.price,
        pnl: 0,
        pnlPercentage: 0,
        margin: (trade.price * trade.quantity) / trade.lotSize,
        leverage: 1,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        isOpen: true,
        openedAt: new Date(),
        relatedTrades: [trade._id],
      });

      await newPosition.save();
    }
  }

  private async validateOrder(orderDto: PlaceOrderDto): Promise<void> {
    // Validate quantity
    if (orderDto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Validate price for limit orders
    if (orderDto.orderType === OrderType.LIMIT && !orderDto.price) {
      throw new BadRequestException('Limit order requires a price');
    }

    // Validate stop loss
    if (orderDto.stopLoss) {
      const currentPrice = await this.getCurrentMarketPrice(orderDto.symbol);
      if (orderDto.tradeType === TradeType.BUY && orderDto.stopLoss >= currentPrice) {
        throw new BadRequestException('Stop loss for buy order must be below current price');
      }
      if (orderDto.tradeType === TradeType.SELL && orderDto.stopLoss <= currentPrice) {
        throw new BadRequestException('Stop loss for sell order must be above current price');
      }
    }

    // Add more validation as needed
  }

  private async getCurrentMarketPrice(symbol: string): Promise<number> {
    // In production, this would fetch from market data service or Redis cache
    // For now, return a mock price
    return 50000;
  }

  private async publishTradeEvent(trade: TradeDocument): Promise<void> {
    // In production, publish to Kafka/RabbitMQ
    console.log('Trade executed:', trade._id);
  }
}
