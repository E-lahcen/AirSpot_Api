import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateTemplateStoryboardDto,
  SceneDto,
} from './create-template-storyboard.dto';

export class UpdateTemplateStoryboardDto extends PartialType(
  CreateTemplateStoryboardDto,
) {
  @ApiPropertyOptional({ description: 'Template storyboard title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Duration' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({ description: 'Scenes (JSON string)' })
  @IsString()
  @IsOptional()
  scenes?: string;

  @ApiPropertyOptional({ description: 'Scenes data', type: [SceneDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SceneDto)
  @IsOptional()
  scenesData?: SceneDto[];

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Creation date of the template storyboard',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs in the history',
    type: [String],
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageHistory?: string[];

  @ApiPropertyOptional({ description: 'Description of the template' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Category of the template' })
  @IsString()
  @IsOptional()
  category?: string;
}
