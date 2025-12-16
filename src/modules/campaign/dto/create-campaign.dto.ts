import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AudienceDataDto {
  @ApiPropertyOptional({ description: 'Locations', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  locations?: string[];

  @ApiPropertyOptional({ description: 'Interests', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @ApiPropertyOptional({ description: 'Demographics', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  demographics?: number[];

  @ApiPropertyOptional({ description: 'Genders', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  genders?: string[];
}

export class CreateCampaignDto {
  @ApiPropertyOptional({ description: 'Campaign ID' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Selected goal' })
  @IsString()
  selectedGoal: string;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Selected days', type: Object })
  @IsObject()
  selectedDays: Record<string, any>;

  @ApiProperty({ description: 'Budget amount' })
  @IsString()
  budgetAmount: string;

  @ApiPropertyOptional({ description: 'Audience data', type: AudienceDataDto })
  @ValidateNested()
  @Type(() => AudienceDataDto)
  @IsOptional()
  audience?: AudienceDataDto;

  @ApiProperty({ description: 'Selected broadcast TV', type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedBroadcastTV: string[];

  @ApiProperty({ description: 'Selected streaming', type: [String] })
  @IsArray()
  @IsString({ each: true })
  selectedStreaming: string[];

  @ApiProperty({ description: 'Bidding strategy' })
  @IsString()
  biddingStrategy: string;

  @ApiPropertyOptional({ description: 'Creative data', type: Object })
  @IsOptional()
  @IsObject()
  creativeData?: Record<string, any>;

  @ApiProperty({ description: 'Status' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Impressions', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  impressions?: number;

  @ApiPropertyOptional({ description: 'Reach', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reach?: number;

  @ApiPropertyOptional({ description: 'Spend', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  spend?: number;

  @ApiPropertyOptional({ description: 'ROI' })
  @IsString()
  @IsOptional()
  roi?: string;
}
