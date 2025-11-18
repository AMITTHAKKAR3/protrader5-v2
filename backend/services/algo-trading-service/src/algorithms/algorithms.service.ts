import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Algorithm, AlgorithmDocument } from '../database/schemas/algorithm.schema';
import { Backtest, BacktestDocument } from '../database/schemas/backtest.schema';

@Injectable()
export class AlgorithmsService {
  constructor(
    @InjectModel(Algorithm.name) private algorithmModel: Model<AlgorithmDocument>,
    @InjectModel(Backtest.name) private backtestModel: Model<BacktestDocument>,
  ) {}

  async create(userId: string, createAlgorithmDto: any): Promise<Algorithm> {
    const algorithm = new this.algorithmModel({
      userId: new Types.ObjectId(userId),
      ...createAlgorithmDto,
      status: 'Draft',
    });

    return algorithm.save();
  }

  async findAll(userId: string, filters?: any): Promise<Algorithm[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.strategyType) {
      query.strategyType = filters.strategyType;
    }

    return this.algorithmModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, algorithmId: string): Promise<Algorithm> {
    const algorithm = await this.algorithmModel.findOne({
      _id: algorithmId,
      userId: new Types.ObjectId(userId),
    });

    if (!algorithm) {
      throw new NotFoundException('Algorithm not found');
    }

    return algorithm;
  }

  async update(
    userId: string,
    algorithmId: string,
    updates: any,
  ): Promise<Algorithm> {
    const algorithm = await this.findOne(userId, algorithmId);

    if (algorithm.status === 'Live') {
      throw new BadRequestException('Cannot update live algorithm');
    }

    return this.algorithmModel
      .findByIdAndUpdate(algorithmId, updates, { new: true })
      .exec();
  }

  async updateStatus(
    userId: string,
    algorithmId: string,
    status: string,
  ): Promise<Algorithm> {
    const algorithm = await this.findOne(userId, algorithmId);

    const validTransitions = {
      Draft: ['Testing', 'Live'],
      Testing: ['Draft', 'Live', 'Paused'],
      Live: ['Paused', 'Stopped'],
      Paused: ['Live', 'Stopped'],
      Stopped: ['Draft'],
    };

    if (!validTransitions[algorithm.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${algorithm.status} to ${status}`,
      );
    }

    if (status === 'Live' && !algorithm.backtestResults) {
      throw new BadRequestException('Must backtest algorithm before going live');
    }

    algorithm.status = status;

    if (status === 'Live' && !algorithm.livePerformance) {
      algorithm.livePerformance = {
        startDate: new Date(),
        endDate: null,
        initialCapital: 0,
        currentCapital: 0,
        totalTrades: 0,
        profitableTrades: 0,
        totalPnL: 0,
      };
    }

    return algorithm.save();
  }

  async delete(userId: string, algorithmId: string): Promise<void> {
    const algorithm = await this.findOne(userId, algorithmId);

    if (algorithm.status === 'Live') {
      throw new BadRequestException('Cannot delete live algorithm');
    }

    await this.algorithmModel.findByIdAndDelete(algorithmId);
  }

  async runBacktest(
    userId: string,
    algorithmId: string,
    backtestParams: {
      startDate: Date;
      endDate: Date;
      initialCapital: number;
    },
  ): Promise<Backtest> {
    const algorithm = await this.findOne(userId, algorithmId);

    // Create backtest record
    const backtest = new this.backtestModel({
      algorithmId: new Types.ObjectId(algorithmId),
      userId: new Types.ObjectId(userId),
      startDate: backtestParams.startDate,
      endDate: backtestParams.endDate,
      initialCapital: backtestParams.initialCapital,
      finalCapital: backtestParams.initialCapital,
      status: 'Pending',
    });

    await backtest.save();

    // Run backtest asynchronously
    this.executeBacktest(backtest._id.toString(), algorithm).catch((error) => {
      console.error('Backtest failed:', error);
      this.backtestModel.findByIdAndUpdate(backtest._id, {
        status: 'Failed',
        errorMessage: error.message,
      });
    });

    return backtest;
  }

  private async executeBacktest(
    backtestId: string,
    algorithm: AlgorithmDocument,
  ): Promise<void> {
    // Update status to running
    await this.backtestModel.findByIdAndUpdate(backtestId, {
      status: 'Running',
    });

    const backtest = await this.backtestModel.findById(backtestId);

    // Simulate backtest execution
    // In production, this would fetch historical data and simulate trades
    const simulatedResults = await this.simulateBacktest(
      algorithm,
      backtest.startDate,
      backtest.endDate,
      backtest.initialCapital,
    );

    // Update backtest with results
    backtest.status = 'Completed';
    backtest.finalCapital = simulatedResults.finalCapital;
    backtest.results = simulatedResults.results;
    backtest.equityCurve = simulatedResults.equityCurve;
    backtest.trades = simulatedResults.trades;

    await backtest.save();

    // Update algorithm with backtest results
    await this.algorithmModel.findByIdAndUpdate(algorithm._id, {
      backtestResults: simulatedResults.results,
    });
  }

  private async simulateBacktest(
    algorithm: AlgorithmDocument,
    startDate: Date,
    endDate: Date,
    initialCapital: number,
  ): Promise<any> {
    // This is a simplified simulation
    // In production, you would:
    // 1. Fetch historical market data
    // 2. Apply entry/exit conditions
    // 3. Simulate trades
    // 4. Calculate performance metrics

    const totalTrades = Math.floor(Math.random() * 100) + 50;
    const profitableTrades = Math.floor(totalTrades * (0.5 + Math.random() * 0.3));
    const losingTrades = totalTrades - profitableTrades;

    const totalReturn = (Math.random() * 0.4 - 0.1) * initialCapital;
    const finalCapital = initialCapital + totalReturn;

    const results = {
      totalReturn,
      totalReturnPercentage: (totalReturn / initialCapital) * 100,
      sharpeRatio: Math.random() * 2,
      sortinoRatio: Math.random() * 2.5,
      maxDrawdown: Math.random() * 0.2 * initialCapital,
      maxDrawdownPercentage: Math.random() * 20,
      winRate: (profitableTrades / totalTrades) * 100,
      profitFactor: profitableTrades / (losingTrades || 1),
      totalTrades,
      profitableTrades,
      losingTrades,
      averageProfit: (totalReturn / profitableTrades) || 0,
      averageLoss: (totalReturn / losingTrades) || 0,
      largestWin: Math.random() * 5000,
      largestLoss: Math.random() * -3000,
      averageHoldingPeriod: Math.random() * 24,
      volatility: Math.random() * 0.3,
    };

    // Generate equity curve
    const equityCurve = [];
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let currentCapital = initialCapital;

    for (let i = 0; i <= days; i += Math.floor(days / 50)) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      currentCapital += (Math.random() - 0.48) * 1000;
      equityCurve.push({ date, value: currentCapital });
    }

    // Generate sample trades
    const trades = [];
    for (let i = 0; i < Math.min(totalTrades, 100); i++) {
      const entryDate = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()),
      );
      const exitDate = new Date(entryDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const entryPrice = 50000 + Math.random() * 10000;
      const exitPrice = entryPrice * (1 + (Math.random() - 0.45) * 0.1);
      const quantity = Math.floor(Math.random() * 10) + 1;
      const pnl = (exitPrice - entryPrice) * quantity;

      trades.push({
        entryDate,
        exitDate,
        symbol: algorithm.symbols[0] || 'BTCUSDT',
        type: Math.random() > 0.5 ? 'Buy' : 'Sell',
        entryPrice,
        exitPrice,
        quantity,
        pnl,
        pnlPercentage: ((exitPrice - entryPrice) / entryPrice) * 100,
      });
    }

    return {
      finalCapital,
      results,
      equityCurve,
      trades,
    };
  }

  async getBacktests(userId: string, algorithmId: string): Promise<Backtest[]> {
    return this.backtestModel
      .find({
        algorithmId: new Types.ObjectId(algorithmId),
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getBacktest(userId: string, backtestId: string): Promise<Backtest> {
    const backtest = await this.backtestModel.findOne({
      _id: backtestId,
      userId: new Types.ObjectId(userId),
    });

    if (!backtest) {
      throw new NotFoundException('Backtest not found');
    }

    return backtest;
  }

  async getPublicAlgorithms(): Promise<Algorithm[]> {
    return this.algorithmModel
      .find({ isPublic: true, status: 'Live' })
      .sort({ 'backtestResults.totalReturn': -1 })
      .limit(50)
      .exec();
  }
}
