import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAudienceDto {
  @ApiPropertyOptional({ description: 'Audience ID' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Audience name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Audience category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Audience size' })
  @IsString()
  size: string;

  @ApiProperty({ description: 'Reached count' })
  @IsString()
  reached: string;

  @ApiProperty({ description: 'Platforms', type: [String] })
  @IsArray()
  @IsString({ each: true })
  platforms: string[];

  @ApiProperty({ description: 'Campaigns' })
  @IsString()
  campaigns: string;

  @ApiProperty({ description: 'Selected locations', type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedLocations: string[];

  @ApiProperty({ description: 'Selected interests', type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedInterests: string[];

  @ApiProperty({ description: 'Age range', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ageRange: number[];

  @ApiProperty({ description: 'Selected genders', type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedGenders: string[];

  @ApiPropertyOptional({ description: 'Created at timestamp' })
  @IsDateString()
  @IsOptional()
  createdAt?: string;
}
