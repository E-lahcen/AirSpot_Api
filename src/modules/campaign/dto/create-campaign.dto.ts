import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsObject,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ description: 'Audience IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  audienceIds?: string[];

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

  @ApiPropertyOptional({
    description: 'Spend',
    type: 'number',
    format: 'float',
    default: 0,
  })
  @IsOptional()
  spend?: number;

  @ApiPropertyOptional({ description: 'ROI' })
  @IsString()
  @IsOptional()
  roi?: string;
}
