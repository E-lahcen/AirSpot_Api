import {
  IsString,
  IsOptional,
  Min,
  IsUUID,
  IsInt,
  IsArray,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCreativeDto {
  @ApiProperty({
    description: 'Organization id (UUID)',
    example: '3ab4c861-b76f-46a7-aa37-b2b928b3274e',
  })
  @IsUUID()
  organization_id: string;

  @ApiPropertyOptional({
    description: 'Brand id (UUID) - Optional',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Transform(({ value }): string | null => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    return value as string;
  })
  @ValidateIf((object): boolean => {
    const o = object as CreateCreativeDto;
    const brandId = o.brand_id;
    return !!(brandId && brandId !== '');
  })
  @IsUUID()
  brand_id?: string | null;

  @ApiProperty({ description: 'Creative name', example: 'Summer' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Creative description', example: null })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Orientation', example: 'vertical' })
  @IsOptional()
  @IsString()
  orientation?: string;

  @ApiPropertyOptional({ description: 'Theme', example: 'blue' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ description: 'Video position', example: 'left' })
  @IsOptional()
  @IsString()
  video_position?: string;

  @ApiPropertyOptional({ description: 'Brand name', example: 'DBA' })
  @IsOptional()
  @IsString()
  brand_name?: string;

  @ApiPropertyOptional({ description: 'Price (string)', example: '100' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'ADS' })
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional({ description: 'Feature list', example: ['Foot'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Whether to show QR code',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  show_qr_code?: boolean;

  @ApiPropertyOptional({ description: 'QR code text', example: 'dba.ma/ads' })
  @IsOptional()
  @IsString()
  qr_code_text?: string;

  @ApiPropertyOptional({
    description: 'Logo path',
    example: 'templates/...jpeg',
  })
  @IsOptional()
  @IsString()
  logo_path?: string;

  @ApiPropertyOptional({
    description: 'Product image path',
    example: 'templates/...png',
  })
  @IsOptional()
  @IsString()
  product_image_path?: string;

  @ApiPropertyOptional({
    description: 'Video path',
    example: 'creatives/...mp4',
  })
  @IsOptional()
  @IsString()
  video_path?: string;

  @ApiPropertyOptional({
    description: 'Video width in pixels',
    example: 1920,
  })
  @IsOptional()
  @IsInt()
  video_width?: number;

  @ApiPropertyOptional({
    description: 'Video height in pixels',
    example: 1080,
  })
  @IsOptional()
  @IsInt()
  video_height?: number;

  @ApiPropertyOptional({
    description: 'Video duration in seconds',
    example: 30.5,
  })
  @IsOptional()
  video_duration?: number;

  @ApiPropertyOptional({
    description: 'Video format',
    example: 'mp4',
  })
  @IsOptional()
  @IsString()
  video_format?: string;

  @ApiPropertyOptional({
    description: 'Template image path',
    example: 'templates/...png',
  })
  @IsOptional()
  @IsString()
  template_image_path?: string;

  @ApiPropertyOptional({
    description: 'Owner id (UUID)',
    example: 'f6a76615-1d2f-4066-99ca-82469b54d8d9',
  })
  @IsOptional()
  @IsUUID()
  owner_id?: string;

  @ApiPropertyOptional({
    description: 'Filename',
    example: '3c4d53f2-264c-447a-9b05-0d7e8ca2a94d.png',
  })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({ description: 'Campaign count', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  campaign_count?: number;

  @ApiPropertyOptional({
    description: 'Template id (UUID)',
    example: 'bbbbbbbbb-h4h4-h4h-aa37-aaaaaaaaaaa',
  })
  @IsOptional()
  @IsUUID()
  id_template?: string;
}
