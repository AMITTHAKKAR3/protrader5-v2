import { IsEnum, IsString, IsNumber, IsOptional, Min, IsDate, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrderType, TradeType, ProductType, ExecutionMode, Exchange } from '../../common/enums/order.enum';

class BracketOrderDto {
  @ApiProperty()
  @IsNumber()
  entryPrice: number;

  @ApiProperty()
  @IsNumber()
  targetPrice: number;

  @ApiProperty()
  @IsNumber()
  stopLossPrice: number;

  @ApiProperty()
  @IsBoolean()
  trailingStop: boolean;
}

export class PlaceOrderDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol: string;

  @ApiProperty({ enum: Exchange, example: Exchange.NSE })
  @IsEnum(Exchange)
  exchange: Exchange;

  @ApiProperty({ enum: OrderType, example: OrderType.MARKET })
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({ enum: TradeType, example: TradeType.BUY })
  @IsEnum(TradeType)
  tradeType: TradeType;

  @ApiProperty({ enum: ProductType, example: ProductType.INTRADAY })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  lotSize: number;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ example: 48000, required: false })
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiProperty({ example: 52000, required: false })
  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  trailingDistance?: number;

  @ApiProperty({ enum: ExecutionMode, example: ExecutionMode.GTC, required: false })
  @IsOptional()
  @IsEnum(ExecutionMode)
  executionMode?: ExecutionMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;

  // For Iceberg orders
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  displayQuantity?: number;

  // For TWAP/VWAP orders
  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  @IsNumber()
  executionDuration?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  intervalDuration?: number;

  // For Bracket orders
  @ApiProperty({ type: BracketOrderDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BracketOrderDto)
  bracketOrder?: BracketOrderDto;
}
