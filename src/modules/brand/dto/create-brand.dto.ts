import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
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
    description: 'Brand logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @ApiPropertyOptional({
    description: 'Brand primary color (hex format)',
    example: '#FF5733',
  })
  @IsOptional()
  @IsHexColor()
  primary_color?: string;

  @ApiPropertyOptional({
    description: 'Brand secondary color (hex format)',
    example: '#33FF57',
  })
  @IsOptional()
  @IsHexColor()
  secondary_color?: string;

  @ApiPropertyOptional({
    description: 'Brand description',
    example: 'A leading sportswear brand',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the brand is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
