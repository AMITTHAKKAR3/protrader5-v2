import { IsString, IsEnum, IsArray, IsObject, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class IndicatorConditionDto {
  @ApiProperty({ example: 'RSI' })
  @IsString()
  name: string;

  @ApiProperty({ example: { period: 14 } })
  @IsObject()
  params: Record<string, any>;

  @ApiProperty({ example: 'greater_than' })
  @IsString()
  condition: string;

  @ApiProperty({ example: 70 })
  value: number;
}

class EntryConditionsDto {
  @ApiProperty({ type: [IndicatorConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicatorConditionDto)
  indicators: IndicatorConditionDto[];

  @ApiProperty({ example: 'AND' })
  @IsEnum(['AND', 'OR'])
  logic: string;
}

class ExitConditionsDto {
  @ApiProperty({ type: [IndicatorConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicatorConditionDto)
  indicators: IndicatorConditionDto[];

  @ApiProperty({ example: 'OR' })
  @IsEnum(['AND', 'OR'])
  logic: string;

  @ApiProperty({ example: 2 })
  stopLoss: number;

  @ApiProperty({ example: 5 })
  takeProfit: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  trailingStop: boolean;
}

class RiskManagementDto {
  @ApiProperty({ example: 10000 })
  maxPositionSize: number;

  @ApiProperty({ example: 5 })
  maxOpenPositions: number;

  @ApiProperty({ example: 5000 })
  maxDailyLoss: number;

  @ApiProperty({ example: 10 })
  maxDrawdown: number;
}

export class CreateAlgorithmDto {
  @ApiProperty({ example: 'RSI Momentum Strategy' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Buy when RSI < 30, sell when RSI > 70' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ['Momentum', 'Mean Reversion', 'Breakout', 'Arbitrage', 'Market Making', 'Custom'] })
  @IsEnum(['Momentum', 'Mean Reversion', 'Breakout', 'Arbitrage', 'Market Making', 'Custom'])
  strategyType: string;

  @ApiProperty({ example: ['BTCUSDT', 'ETHUSDT'] })
  @IsArray()
  symbols: string[];

  @ApiProperty({ example: ['NSE', 'BSE'] })
  @IsArray()
  exchanges: string[];

  @ApiProperty({ enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] })
  @IsEnum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'])
  timeframe: string;

  @ApiProperty({ type: EntryConditionsDto })
  @ValidateNested()
  @Type(() => EntryConditionsDto)
  entryConditions: EntryConditionsDto;

  @ApiProperty({ type: ExitConditionsDto })
  @ValidateNested()
  @Type(() => ExitConditionsDto)
  exitConditions: ExitConditionsDto;

  @ApiProperty({ type: RiskManagementDto })
  @ValidateNested()
  @Type(() => RiskManagementDto)
  riskManagement: RiskManagementDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
