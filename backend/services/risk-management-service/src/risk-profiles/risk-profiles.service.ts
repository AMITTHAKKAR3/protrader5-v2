import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RiskProfile, RiskProfileDocument } from '../database/schemas/risk-profile.schema';
import { RiskAlert, RiskAlertDocument } from '../database/schemas/risk-alert.schema';
import * as math from 'mathjs';

@Injectable()
export class RiskProfilesService {
  constructor(
    @InjectModel(RiskProfile.name) private riskProfileModel: Model<RiskProfileDocument>,
    @InjectModel(RiskAlert.name) private riskAlertModel: Model<RiskAlertDocument>,
  ) {}

  async createProfile(userId: string, profileData: any): Promise<RiskProfile> {
    const existingProfile = await this.riskProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (existingProfile) {
      throw new BadRequestException('Risk profile already exists for this user');
    }

    const profile = new this.riskProfileModel({
      userId: new Types.ObjectId(userId),
      ...profileData,
      currentStatus: {
        currentDailyLoss: 0,
        currentDrawdown: 0,
        openPositionsCount: 0,
        totalExposure: 0,
        marginUsed: 0,
        lastUpdated: new Date(),
      },
    });

    return profile.save();
  }

  async getProfile(userId: string): Promise<RiskProfile> {
    const profile = await this.riskProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) {
      throw new NotFoundException('Risk profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, updates: any): Promise<RiskProfile> {
    const profile = await this.getProfile(userId);

    Object.assign(profile, updates);
    return profile.save();
  }

  async checkRiskLimits(userId: string, tradeData: any): Promise<{
    allowed: boolean;
    violations: string[];
    warnings: string[];
  }> {
    const profile = await this.getProfile(userId);
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check daily loss limit
    if (profile.currentStatus.currentDailyLoss >= profile.maxDailyLoss) {
      violations.push('Daily loss limit exceeded');
    }

    // Check position size
    if (tradeData.positionSize > profile.maxPositionSize) {
      violations.push('Position size exceeds maximum allowed');
    }

    // Check max open positions
    if (profile.currentStatus.openPositionsCount >= profile.maxOpenPositions) {
      violations.push('Maximum open positions limit reached');
    }

    // Check leverage
    if (tradeData.leverage > profile.maxLeverage) {
      violations.push('Leverage exceeds maximum allowed');
    }

    // Check restricted symbols
    if (profile.restrictedSymbols.includes(tradeData.symbol)) {
      violations.push('Symbol is restricted');
    }

    // Check allowed symbols
    if (profile.allowedSymbols.length > 0 && !profile.allowedSymbols.includes(tradeData.symbol)) {
      violations.push('Symbol is not in allowed list');
    }

    // Check allowed exchanges
    if (profile.allowedExchanges.length > 0 && !profile.allowedExchanges.includes(tradeData.exchange)) {
      violations.push('Exchange is not allowed');
    }

    // Check stop loss requirement
    if (profile.requireStopLoss && !tradeData.stopLoss) {
      violations.push('Stop loss is required');
    }

    // Check margin trading
    if (tradeData.isMarginTrade && !profile.allowMarginTrading) {
      violations.push('Margin trading is not allowed');
    }

    // Warnings for approaching limits
    if (profile.currentStatus.currentDailyLoss > profile.maxDailyLoss * 0.8) {
      warnings.push('Approaching daily loss limit (80%)');
    }

    if (profile.currentStatus.openPositionsCount >= profile.maxOpenPositions * 0.9) {
      warnings.push('Approaching max open positions (90%)');
    }

    return {
      allowed: violations.length === 0,
      violations,
      warnings,
    };
  }

  async calculatePositionSize(
    userId: string,
    accountBalance: number,
    riskPercentage: number,
    entryPrice: number,
    stopLossPrice: number,
  ): Promise<number> {
    const profile = await this.getProfile(userId);

    const riskAmount = accountBalance * (riskPercentage / 100);
    const priceRisk = Math.abs(entryPrice - stopLossPrice);
    const positionSize = riskAmount / priceRisk;

    // Apply max position size limit
    return Math.min(positionSize, profile.maxPositionSize);
  }

  async calculateMargin(
    userId: string,
    positionSize: number,
    price: number,
    leverage: number,
  ): Promise<number> {
    const profile = await this.getProfile(userId);

    if (leverage > profile.maxLeverage) {
      throw new BadRequestException('Leverage exceeds maximum allowed');
    }

    const positionValue = positionSize * price;
    return positionValue / leverage;
  }

  async updateCurrentStatus(userId: string, statusData: any): Promise<void> {
    await this.riskProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          'currentStatus.currentDailyLoss': statusData.currentDailyLoss || 0,
          'currentStatus.currentDrawdown': statusData.currentDrawdown || 0,
          'currentStatus.openPositionsCount': statusData.openPositionsCount || 0,
          'currentStatus.totalExposure': statusData.totalExposure || 0,
          'currentStatus.marginUsed': statusData.marginUsed || 0,
          'currentStatus.lastUpdated': new Date(),
        },
      },
    );

    // Check for violations and create alerts
    await this.checkAndCreateAlerts(userId);
  }

  private async checkAndCreateAlerts(userId: string): Promise<void> {
    const profile = await this.getProfile(userId);

    // Check daily loss limit
    if (profile.currentStatus.currentDailyLoss >= profile.maxDailyLoss) {
      await this.createAlert(userId, {
        type: 'DailyLossLimit',
        severity: 'Critical',
        message: 'Daily loss limit exceeded',
        details: {
          currentLoss: profile.currentStatus.currentDailyLoss,
          limit: profile.maxDailyLoss,
        },
      });
    }

    // Check drawdown limit
    if (profile.currentStatus.currentDrawdown >= profile.maxDrawdown) {
      await this.createAlert(userId, {
        type: 'DrawdownLimit',
        severity: 'High',
        message: 'Maximum drawdown limit exceeded',
        details: {
          currentDrawdown: profile.currentStatus.currentDrawdown,
          limit: profile.maxDrawdown,
        },
      });
    }

    // Check max positions
    if (profile.currentStatus.openPositionsCount >= profile.maxOpenPositions) {
      await this.createAlert(userId, {
        type: 'MaxPositionsLimit',
        severity: 'Medium',
        message: 'Maximum open positions limit reached',
        details: {
          currentPositions: profile.currentStatus.openPositionsCount,
          limit: profile.maxOpenPositions,
        },
      });
    }
  }

  async createAlert(userId: string, alertData: any): Promise<RiskAlert> {
    // Check if similar alert already exists
    const existingAlert = await this.riskAlertModel.findOne({
      userId: new Types.ObjectId(userId),
      type: alertData.type,
      acknowledged: false,
      resolved: false,
    });

    if (existingAlert) {
      return existingAlert;
    }

    const alert = new this.riskAlertModel({
      userId: new Types.ObjectId(userId),
      ...alertData,
      triggeredAt: new Date(),
    });

    return alert.save();
  }

  async getAlerts(userId: string, filters?: any): Promise<RiskAlert[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.acknowledged !== undefined) {
      query.acknowledged = filters.acknowledged;
    }

    if (filters?.resolved !== undefined) {
      query.resolved = filters.resolved;
    }

    if (filters?.severity) {
      query.severity = filters.severity;
    }

    return this.riskAlertModel.find(query).sort({ triggeredAt: -1 }).limit(100).exec();
  }

  async acknowledgeAlert(userId: string, alertId: string): Promise<RiskAlert> {
    return this.riskAlertModel
      .findOneAndUpdate(
        { _id: alertId, userId: new Types.ObjectId(userId) },
        {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        },
        { new: true },
      )
      .exec();
  }

  async resolveAlert(userId: string, alertId: string, resolution: string): Promise<RiskAlert> {
    return this.riskAlertModel
      .findOneAndUpdate(
        { _id: alertId, userId: new Types.ObjectId(userId) },
        {
          resolved: true,
          resolvedAt: new Date(),
          resolution,
        },
        { new: true },
      )
      .exec();
  }

  async getPortfolioRisk(userId: string, positions: any[]): Promise<any> {
    const profile = await this.getProfile(userId);

    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
    const totalExposure = positions.reduce((sum, pos) => sum + Math.abs(pos.value), 0);

    // Calculate Value at Risk (VaR) - simplified
    const returns = positions.map((pos) => (pos.pnl / pos.value) * 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const var95 = avgReturn - 1.65 * stdDev; // 95% confidence

    return {
      totalValue,
      totalPnL,
      totalExposure,
      exposurePercentage: (totalExposure / profile.maxPositionSize) * 100,
      openPositions: positions.length,
      maxPositions: profile.maxOpenPositions,
      currentDailyLoss: profile.currentStatus.currentDailyLoss,
      maxDailyLoss: profile.maxDailyLoss,
      dailyLossPercentage: (profile.currentStatus.currentDailyLoss / profile.maxDailyLoss) * 100,
      valueAtRisk95: var95,
      riskScore: this.calculateRiskScore(profile, positions),
    };
  }

  private calculateRiskScore(profile: RiskProfileDocument, positions: any[]): number {
    let score = 0;

    // Daily loss factor (0-30 points)
    const dailyLossRatio = profile.currentStatus.currentDailyLoss / profile.maxDailyLoss;
    score += dailyLossRatio * 30;

    // Position count factor (0-20 points)
    const positionRatio = profile.currentStatus.openPositionsCount / profile.maxOpenPositions;
    score += positionRatio * 20;

    // Exposure factor (0-25 points)
    const exposureRatio = profile.currentStatus.totalExposure / (profile.maxPositionSize * profile.maxOpenPositions);
    score += exposureRatio * 25;

    // Drawdown factor (0-25 points)
    const drawdownRatio = profile.currentStatus.currentDrawdown / profile.maxDrawdown;
    score += drawdownRatio * 25;

    return Math.min(100, Math.max(0, score));
  }
}
