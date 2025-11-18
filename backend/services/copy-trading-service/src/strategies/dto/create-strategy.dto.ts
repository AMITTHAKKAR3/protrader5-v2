import { IsString, IsNumber, IsEnum, IsArray, IsOptional, Min, Max, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RiskManagementDto {
  @ApiProperty()
  @IsNumber()
  maxPositionSize: number;

  @ApiProperty()
  @IsNumber()
  maxDailyLoss: number;

  @ApiProperty()
  @IsNumber()
  maxOpenPositions: number;

  @ApiProperty()
  @IsBoolean()
  stopLossRequired: boolean;
}

export class CreateStrategyDto {
  @ApiProperty({ example: 'Momentum Trading Strategy' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'High-frequency momentum-based trading strategy' })
  @IsString()
  description: string;

  @ApiProperty({ example: ['momentum', 'high-frequency', 'stocks'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ enum: ['Public', 'Private', 'Invite-Only'], example: 'Public' })
  @IsEnum(['Public', 'Private', 'Invite-Only'])
  visibility: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  subscriptionFee: number;

  @ApiProperty({ enum: ['Monthly', 'Quarterly', 'Yearly', 'One-Time'], example: 'Monthly' })
  @IsEnum(['Monthly', 'Quarterly', 'Yearly', 'One-Time'])
  feeType: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  profitSharingPercentage: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  minInvestment: number;

  @ApiProperty({ example: 1000000, required: false })
  @IsOptional()
  @IsNumber()
  maxInvestment?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  maxSubscribers?: number;

  @ApiProperty({ example: ['BTCUSDT', 'ETHUSDT'] })
  @IsArray()
  @IsOptional()
  allowedSymbols?: string[];

  @ApiProperty({ example: ['NSE', 'BSE'] })
  @IsArray()
  @IsOptional()
  allowedExchanges?: string[];

  @ApiProperty({ type: RiskManagementDto })
  @ValidateNested()
  @Type(() => RiskManagementDto)
  riskManagement: RiskManagementDto;
}
