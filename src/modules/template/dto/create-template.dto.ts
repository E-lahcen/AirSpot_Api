import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum Orientation {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

export enum VideoPosition {
  LEFT = 'left',
  RIGHT = 'right',
}

export class CreateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: Orientation,
    description: 'Template orientation',
  })
  @IsOptional()
  @IsEnum(Orientation)
  orientation?: Orientation;

  @ApiPropertyOptional({ description: 'Theme name' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ enum: VideoPosition, description: 'Video position' })
  @IsOptional()
  @IsEnum(VideoPosition)
  videoPosition?: VideoPosition;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ description: 'Product price' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: 'Product features', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Show QR code', default: false })
  @IsOptional()
  @IsBoolean()
  showQRCode?: boolean;

  @ApiPropertyOptional({ description: 'QR code text' })
  @IsOptional()
  @IsString()
  qrCodeText?: string;

  @ApiPropertyOptional({ description: 'Logo file path (from upload)' })
  @IsOptional()
  @IsString()
  logoPath?: string;

  @ApiPropertyOptional({ description: 'Product image path (from upload)' })
  @IsOptional()
  @IsString()
  productImagePath?: string;

  @ApiPropertyOptional({ description: 'Video path (from upload)' })
  @IsOptional()
  @IsString()
  videoPath?: string;
}
