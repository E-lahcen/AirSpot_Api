import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Organization (tenant) ID that owns this brand',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenant_id: string;

  @ApiProperty({
    description: 'Brand name',
    example: 'Nike',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

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
}
