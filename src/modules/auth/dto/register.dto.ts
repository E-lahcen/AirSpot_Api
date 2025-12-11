import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
    name: 'first_name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
    name: 'last_name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  last_name?: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Company name for tenant creation',
    example: 'Acme Corporation',
    name: 'company_name',
  })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@acme.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the account (minimum 6 characters)',
    example: 'SecurePass123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Email verification code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  verification_code: string;
}
