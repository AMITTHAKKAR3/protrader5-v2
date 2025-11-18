import { IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RunBacktestDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2024-12-31' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(1000)
  initialCapital: number;
}
