import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SceneDto {
  @ApiProperty({ description: 'Unique ID for the scene' })
  @IsNumber()
  @Min(1)
  id: number;

  @ApiProperty({ description: 'Name of the scene' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Title of the scene' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description of the scene' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Audio prompt for the scene' })
  @IsString()
  audioPrompt: string;

  @ApiPropertyOptional({ description: 'URL of the generated audio' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ description: 'Image prompt for the scene' })
  @IsString()
  imagePrompt: string;

  @ApiPropertyOptional({ description: 'URL of the generated image' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Style of the generated image' })
  @IsString()
  @IsOptional()
  imageStyle?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs in the history for this scene',
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
}

export class CreateTemplateStoryboardDto {
  @ApiPropertyOptional({ description: 'Unique ID for the template storyboard' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Title of the template storyboard' })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Duration of the template storyboard (e.g., "30s")',
  })
  @IsString()
  duration: string;

  @ApiProperty({
    description:
      'JSON string representation of scenes (deprecated, use scenesData)',
    example: '[{"id":1,"name":"Opening"}]',
  })
  @IsString()
  scenes: string;

  @ApiPropertyOptional({
    description: 'Creation date of the template storyboard',
    example: '2025-01-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @ApiProperty({
    type: [SceneDto],
    description: 'Detailed data for each scene in the template storyboard',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SceneDto)
  scenesData: SceneDto[];

  @ApiProperty({ description: 'URL of the final generated video' })
  @IsString()
  videoUrl: string;

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

  @ApiPropertyOptional({ description: 'Industry of the template' })
  @IsString()
  @IsOptional()
  industry?: string;
}
