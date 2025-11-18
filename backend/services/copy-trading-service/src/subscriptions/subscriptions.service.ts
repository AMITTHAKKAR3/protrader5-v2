import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../database/schemas/subscription.schema';
import { Strategy, StrategyDocument } from '../database/schemas/strategy.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { StrategiesService } from '../strategies/strategies.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
    private strategiesService: StrategiesService,
  ) {}

  async create(
    followerId: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const strategy = await this.strategiesService.findOne(createSubscriptionDto.strategyId);

    // Validate investment amount
    if (createSubscriptionDto.investmentAmount < strategy.minInvestment) {
      throw new BadRequestException(
        `Minimum investment is ${strategy.minInvestment}`,
      );
    }

    if (strategy.maxInvestment && createSubscriptionDto.investmentAmount > strategy.maxInvestment) {
      throw new BadRequestException(
        `Maximum investment is ${strategy.maxInvestment}`,
      );
    }

    // Check if user already has an active subscription to this strategy
    const existingSubscription = await this.subscriptionModel.findOne({
      followerId: new Types.ObjectId(followerId),
      strategyId: new Types.ObjectId(createSubscriptionDto.strategyId),
      status: 'Active',
    });

    if (existingSubscription) {
      throw new BadRequestException('You already have an active subscription to this strategy');
    }

    // Calculate next billing date based on fee type
    const nextBillingDate = this.calculateNextBillingDate(strategy.feeType);

    const subscription = new this.subscriptionModel({
      followerId: new Types.ObjectId(followerId),
      strategyId: new Types.ObjectId(createSubscriptionDto.strategyId),
      traderId: strategy.traderId,
      status: 'Active',
      investmentAmount: createSubscriptionDto.investmentAmount,
      copyRatio: createSubscriptionDto.copyRatio,
      startDate: new Date(),
      nextBillingDate,
      settings: createSubscriptionDto.settings,
      autoRenew: createSubscriptionDto.autoRenew ?? true,
      performance: {
        totalReturn: 0,
        totalPnL: 0,
        openPositions: 0,
        closedPositions: 0,
        winRate: 0,
      },
    });

    await subscription.save();

    // Increment strategy subscribers count
    await this.strategiesService.incrementSubscribers(createSubscriptionDto.strategyId);

    return subscription;
  }

  async findAll(followerId: string, filters?: any): Promise<Subscription[]> {
    const query: any = { followerId: new Types.ObjectId(followerId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.strategyId) {
      query.strategyId = new Types.ObjectId(filters.strategyId);
    }

    return this.subscriptionModel
      .find(query)
      .populate('strategyId')
      .sort({ startDate: -1 })
      .exec();
  }

  async findOne(followerId: string, subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel
      .findOne({
        _id: subscriptionId,
        followerId: new Types.ObjectId(followerId),
      })
      .populate('strategyId');

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async updateStatus(
    followerId: string,
    subscriptionId: string,
    status: string,
  ): Promise<Subscription> {
    const subscription = await this.findOne(followerId, subscriptionId);

    if (!['Active', 'Paused', 'Cancelled'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    if (status === 'Cancelled') {
      subscription.endDate = new Date();
      await this.strategiesService.decrementSubscribers(subscription.strategyId.toString());
    }

    subscription.status = status;
    return subscription.save();
  }

  async updateSettings(
    followerId: string,
    subscriptionId: string,
    settings: Partial<Subscription['settings']>,
  ): Promise<Subscription> {
    const subscription = await this.findOne(followerId, subscriptionId);

    subscription.settings = { ...subscription.settings, ...settings };
    return subscription.save();
  }

  async updateCopyRatio(
    followerId: string,
    subscriptionId: string,
    copyRatio: number,
  ): Promise<Subscription> {
    if (copyRatio < 1 || copyRatio > 100) {
      throw new BadRequestException('Copy ratio must be between 1 and 100');
    }

    return this.subscriptionModel
      .findOneAndUpdate(
        {
          _id: subscriptionId,
          followerId: new Types.ObjectId(followerId),
        },
        { copyRatio },
        { new: true },
      )
      .exec();
  }

  async addCopiedTrade(subscriptionId: string, tradeId: string): Promise<void> {
    await this.subscriptionModel.findByIdAndUpdate(subscriptionId, {
      $push: { copiedTrades: new Types.ObjectId(tradeId) },
    });
  }

  async updatePerformance(
    subscriptionId: string,
    performanceData: Partial<Subscription['performance']>,
  ): Promise<void> {
    await this.subscriptionModel.findByIdAndUpdate(subscriptionId, {
      $set: { performance: performanceData },
    });
  }

  async processSubscriptionFees(): Promise<void> {
    // This would be called by a cron job to process subscription fees
    const dueSubscriptions = await this.subscriptionModel.find({
      status: 'Active',
      nextBillingDate: { $lte: new Date() },
    });

    for (const subscription of dueSubscriptions) {
      const strategy = await this.strategyModel.findById(subscription.strategyId);
      
      // Process payment (integrate with payment service)
      // For now, just update the next billing date
      subscription.nextBillingDate = this.calculateNextBillingDate(strategy.feeType);
      subscription.totalFeesPaid += strategy.subscriptionFee;
      
      await subscription.save();
    }
  }

  async getSubscribersByStrategy(strategyId: string): Promise<Subscription[]> {
    return this.subscriptionModel
      .find({
        strategyId: new Types.ObjectId(strategyId),
        status: 'Active',
      })
      .populate('followerId')
      .exec();
  }

  private calculateNextBillingDate(feeType: string): Date {
    const now = new Date();
    
    switch (feeType) {
      case 'Monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'Quarterly':
        return new Date(now.setMonth(now.getMonth() + 3));
      case 'Yearly':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case 'One-Time':
        return null;
      default:
        return new Date(now.setMonth(now.getMonth() + 1));
    }
  }
}
