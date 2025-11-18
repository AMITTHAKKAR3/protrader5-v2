import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: ['trading', 'account'], required: false })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiProperty({ example: ['192.168.1.1', '10.0.0.1'], required: false })
  @IsArray()
  @IsOptional()
  ipWhitelist?: string[];
}
