import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCreativeDto {
  @ApiProperty({ description: 'Creative name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Creative description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  file_name: string;

  @ApiProperty({ description: 'S3 key/path' })
  @IsString()
  s3_key: string;

  @ApiPropertyOptional({
    description: 'S3 bucket name',
    default: 'airspot-ctv-assets',
  })
  @IsString()
  @IsOptional()
  s3_bucket?: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  file_size: number;

  @ApiProperty({ description: 'MIME type', example: 'video/mp4' })
  @IsString()
  mime_type: string;

  @ApiPropertyOptional({ description: 'Duration in seconds (for videos)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Thumbnail S3 key' })
  @IsString()
  @IsOptional()
  thumbnail_s3_key?: string;
}
