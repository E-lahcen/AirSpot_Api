import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUrl,
  ValidateNested,
  IsObject,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VideoDimensionsDto {
  @ApiProperty({ description: 'Element ID', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'X position' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y position' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: 'Width' })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Height' })
  @IsNumber()
  height: number;
}

export class OverlayVideoDto {
  @ApiProperty({ description: 'URL of the background image' })
  @IsString()
  @IsUrl()
  image: string;

  @ApiProperty({
    description: 'Canvas dimensions (currently not used)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  canvas_dimensions?: any;

  @ApiProperty({
    description: 'URL of the video to overlay',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  video?: string | null;

  @ApiProperty({
    type: VideoDimensionsDto,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => VideoDimensionsDto)
  video_dimensions?: VideoDimensionsDto | null;
}
