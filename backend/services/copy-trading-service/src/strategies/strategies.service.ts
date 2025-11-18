import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Strategy, StrategyDocument } from '../database/schemas/strategy.schema';
import { CreateStrategyDto } from './dto/create-strategy.dto';

@Injectable()
export class StrategiesService {
  constructor(
    @InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
  ) {}

  async create(traderId: string, createStrategyDto: CreateStrategyDto): Promise<Strategy> {
    const strategy = new this.strategyModel({
      traderId: new Types.ObjectId(traderId),
      ...createStrategyDto,
      status: 'Active',
      currentSubscribers: 0,
      performance: {
        totalReturn: 0,
        monthlyReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalTrades: 0,
        profitableTrades: 0,
        averageProfit: 0,
        averageLoss: 0,
      },
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      isFeatured: false,
    });

    return strategy.save();
  }

  async findAll(filters?: any): Promise<Strategy[]> {
    const query: any = { status: 'Active' };

    if (filters?.traderId) {
      query.traderId = new Types.ObjectId(filters.traderId);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters?.minReturn) {
      query['performance.totalReturn'] = { $gte: filters.minReturn };
    }

    if (filters?.visibility) {
      query.visibility = filters.visibility;
    }

    const sortBy = filters?.sortBy || 'rating';
    const sortOrder = filters?.sortOrder === 'asc' ? 1 : -1;

    return this.strategyModel
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(filters?.limit || 50)
      .exec();
  }

  async findOne(id: string): Promise<Strategy> {
    const strategy = await this.strategyModel.findById(id);

    if (!strategy) {
      throw new NotFoundException('Strategy not found');
    }

    return strategy;
  }

  async findByTrader(traderId: string): Promise<Strategy[]> {
    return this.strategyModel.find({ traderId: new Types.ObjectId(traderId) }).exec();
  }

  async update(
    traderId: string,
    strategyId: string,
    updates: Partial<CreateStrategyDto>,
  ): Promise<Strategy> {
    const strategy = await this.findOne(strategyId);

    if (strategy.traderId.toString() !== traderId) {
      throw new ForbiddenException('You can only update your own strategies');
    }

    return this.strategyModel
      .findByIdAndUpdate(strategyId, updates, { new: true })
      .exec();
  }

  async updateStatus(
    traderId: string,
    strategyId: string,
    status: string,
  ): Promise<Strategy> {
    const strategy = await this.findOne(strategyId);

    if (strategy.traderId.toString() !== traderId) {
      throw new ForbiddenException('You can only update your own strategies');
    }

    if (!['Active', 'Paused', 'Closed'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    return this.strategyModel
      .findByIdAndUpdate(strategyId, { status }, { new: true })
      .exec();
  }

  async delete(traderId: string, strategyId: string): Promise<void> {
    const strategy = await this.findOne(strategyId);

    if (strategy.traderId.toString() !== traderId) {
      throw new ForbiddenException('You can only delete your own strategies');
    }

    if (strategy.currentSubscribers > 0) {
      throw new BadRequestException('Cannot delete strategy with active subscribers');
    }

    await this.strategyModel.findByIdAndDelete(strategyId);
  }

  async updatePerformance(
    strategyId: string,
    performanceData: Partial<Strategy['performance']>,
  ): Promise<void> {
    await this.strategyModel.findByIdAndUpdate(strategyId, {
      $set: { performance: performanceData },
    });
  }

  async addEquityPoint(strategyId: string, value: number): Promise<void> {
    await this.strategyModel.findByIdAndUpdate(strategyId, {
      $push: {
        equityCurve: {
          date: new Date(),
          value,
        },
      },
    });
  }

  async incrementSubscribers(strategyId: string): Promise<void> {
    const strategy = await this.findOne(strategyId);

    if (strategy.maxSubscribers > 0 && strategy.currentSubscribers >= strategy.maxSubscribers) {
      throw new BadRequestException('Strategy has reached maximum subscribers');
    }

    await this.strategyModel.findByIdAndUpdate(strategyId, {
      $inc: { currentSubscribers: 1 },
    });
  }

  async decrementSubscribers(strategyId: string): Promise<void> {
    await this.strategyModel.findByIdAndUpdate(strategyId, {
      $inc: { currentSubscribers: -1 },
    });
  }

  async updateRating(strategyId: string, newRating: number): Promise<void> {
    const strategy = await this.findOne(strategyId);
    
    const totalRating = strategy.rating * strategy.reviewCount + newRating;
    const newReviewCount = strategy.reviewCount + 1;
    const averageRating = totalRating / newReviewCount;

    await this.strategyModel.findByIdAndUpdate(strategyId, {
      rating: averageRating,
      reviewCount: newReviewCount,
    });
  }

  async getFeaturedStrategies(): Promise<Strategy[]> {
    return this.strategyModel
      .find({ status: 'Active', isFeatured: true })
      .sort({ rating: -1 })
      .limit(10)
      .exec();
  }

  async getTopPerformers(): Promise<Strategy[]> {
    return this.strategyModel
      .find({ status: 'Active' })
      .sort({ 'performance.totalReturn': -1 })
      .limit(10)
      .exec();
  }

  async searchStrategies(searchTerm: string): Promise<Strategy[]> {
    return this.strategyModel
      .find({
        status: 'Active',
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
        ],
      })
      .limit(20)
      .exec();
  }
}
