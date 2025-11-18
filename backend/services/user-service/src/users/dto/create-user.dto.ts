import { IsEmail, IsString, IsNotEmpty, MinLength, IsPhoneNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: {
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  @IsObject()
  @IsNotEmpty()
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };

  @ApiProperty({ example: 'Client', required: false })
  @IsString()
  @IsOptional()
  role?: string;
}
