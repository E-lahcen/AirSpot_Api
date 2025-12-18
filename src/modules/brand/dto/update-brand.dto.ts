import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateBrandDto {
  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Nike',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Brand description',
    example: 'A leading sportswear brand',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Brand logo URL (image file)',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @ApiPropertyOptional({
    description: 'Brand emoji (alternative to logo)',
    example: '🏢',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Primary contact person name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contact_name?: string;

  @ApiPropertyOptional({
    description: 'Primary contact email',
    example: 'contact@brand.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contact_email?: string;

  @ApiPropertyOptional({
    description: 'Whether the brand is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
