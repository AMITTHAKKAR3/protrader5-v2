import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChartData, ChartDataDocument } from '../database/schemas/chart-data.schema';
import { ChartTemplate, ChartTemplateDocument } from '../database/schemas/chart-template.schema';
import * as TI from 'technicalindicators';

@Injectable()
export class ChartsService {
  constructor(
    @InjectModel(ChartData.name) private chartDataModel: Model<ChartDataDocument>,
    @InjectModel(ChartTemplate.name) private chartTemplateModel: Model<ChartTemplateDocument>,
  ) {}

  async getChartData(
    symbol: string,
    exchange: string,
    timeframe: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<ChartData[]> {
    const query: any = { symbol, exchange, timeframe };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return this.chartDataModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit || 1000)
      .exec();
  }

  async getLatestCandle(
    symbol: string,
    exchange: string,
    timeframe: string,
  ): Promise<ChartData> {
    return this.chartDataModel
      .findOne({ symbol, exchange, timeframe })
      .sort({ timestamp: -1 })
      .exec();
  }

  async addChartData(chartData: Partial<ChartData>): Promise<ChartData> {
    const newData = new this.chartDataModel(chartData);
    return newData.save();
  }

  async calculateIndicators(
    symbol: string,
    exchange: string,
    timeframe: string,
    indicators: string[],
  ): Promise<any> {
    const chartData = await this.getChartData(symbol, exchange, timeframe, null, null, 500);
    
    const closes = chartData.map((d) => d.close);
    const highs = chartData.map((d) => d.high);
    const lows = chartData.map((d) => d.low);
    const volumes = chartData.map((d) => d.volume);

    const results: any = {};

    for (const indicator of indicators) {
      switch (indicator.toUpperCase()) {
        case 'SMA':
          results.SMA = TI.SMA.calculate({ period: 20, values: closes });
          break;
        case 'EMA':
          results.EMA = TI.EMA.calculate({ period: 20, values: closes });
          break;
        case 'RSI':
          results.RSI = TI.RSI.calculate({ period: 14, values: closes });
          break;
        case 'MACD':
          results.MACD = TI.MACD.calculate({
            values: closes,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false,
          });
          break;
        case 'BB':
          results.BB = TI.BollingerBands.calculate({
            period: 20,
            values: closes,
            stdDev: 2,
          });
          break;
        case 'ATR':
          results.ATR = TI.ATR.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: 14,
          });
          break;
        case 'STOCH':
          results.STOCH = TI.Stochastic.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: 14,
            signalPeriod: 3,
          });
          break;
        case 'ADX':
          results.ADX = TI.ADX.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: 14,
          });
          break;
        case 'OBV':
          results.OBV = TI.OBV.calculate({
            close: closes,
            volume: volumes,
          });
          break;
      }
    }

    return results;
  }

  async createTemplate(userId: string, templateData: any): Promise<ChartTemplate> {
    const template = new this.chartTemplateModel({
      userId,
      ...templateData,
    });
    return template.save();
  }

  async getTemplates(userId: string): Promise<ChartTemplate[]> {
    return this.chartTemplateModel.find({ userId }).exec();
  }

  async getPublicTemplates(): Promise<ChartTemplate[]> {
    return this.chartTemplateModel.find({ isPublic: true }).limit(50).exec();
  }

  async getTemplate(userId: string, templateId: string): Promise<ChartTemplate> {
    const template = await this.chartTemplateModel.findOne({
      _id: templateId,
      userId,
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async updateTemplate(
    userId: string,
    templateId: string,
    updates: any,
  ): Promise<ChartTemplate> {
    return this.chartTemplateModel
      .findOneAndUpdate({ _id: templateId, userId }, updates, { new: true })
      .exec();
  }

  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    await this.chartTemplateModel.findOneAndDelete({ _id: templateId, userId });
  }

  async getMultipleSymbolsData(
    symbols: string[],
    exchange: string,
    timeframe: string,
  ): Promise<Record<string, ChartData[]>> {
    const result: Record<string, ChartData[]> = {};

    for (const symbol of symbols) {
      result[symbol] = await this.getChartData(symbol, exchange, timeframe, null, null, 100);
    }

    return result;
  }

  async getOHLCVData(
    symbol: string,
    exchange: string,
    timeframe: string,
    limit: number = 100,
  ): Promise<any[]> {
    const data = await this.getChartData(symbol, exchange, timeframe, null, null, limit);
    
    return data.map((candle) => ({
      time: candle.timestamp.getTime() / 1000,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }));
  }
}
