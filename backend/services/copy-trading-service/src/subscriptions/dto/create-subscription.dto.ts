import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SubscriptionSettingsDto {
  @ApiProperty()
  @IsBoolean()
  stopLoss: boolean;

  @ApiProperty()
  @IsBoolean()
  takeProfit: boolean;

  @ApiProperty()
  @IsNumber()
  maxDailyLoss: number;

  @ApiProperty()
  @IsNumber()
  maxPositionSize: number;
}

export class CreateSubscriptionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  strategyId: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  investmentAmount: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  copyRatio: number;

  @ApiProperty({ type: SubscriptionSettingsDto })
  @ValidateNested()
  @Type(() => SubscriptionSettingsDto)
  settings: SubscriptionSettingsDto;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
