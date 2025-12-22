import {
  IsString,
  IsNumber,
  IsDate,
  IsUUID,
  IsOptional,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PerformanceRecordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ example: '2025-11-12' })
  @IsString()
  date: string;

  @ApiProperty()
  @IsString()
  publisherName: string;

  @ApiProperty()
  @IsNumber()
  impressions: number;

  @ApiProperty()
  @IsNumber()
  spend: number;

  @ApiProperty()
  @IsNumber()
  cpm: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}

export class TimeDistributionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ minimum: 0, maximum: 23 })
  @IsNumber()
  hour: number;

  @ApiProperty()
  @IsNumber()
  impressions: number;

  @ApiProperty()
  @IsNumber()
  percentage: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}

export class ReachMetricsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty()
  @IsNumber()
  totalImpressions: number;

  @ApiProperty()
  @IsNumber()
  uniqueHouseholds: number;

  @ApiProperty()
  @IsNumber()
  frequencyPerHousehold: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}

export class CampaignSummaryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty()
  @IsNumber()
  totalImpressions: number;

  @ApiProperty()
  @IsNumber()
  totalSpend: number;

  @ApiProperty()
  @IsNumber()
  averageCPM: number;

  @ApiProperty()
  @IsNumber()
  uniqueHouseholds: number;

  @ApiProperty()
  @IsNumber()
  averageFrequency: number;

  @ApiProperty()
  @IsNumber()
  totalPublishers: number;

  @ApiProperty()
  @IsNumber()
  activeDays: number;

  @ApiProperty({ example: '2025-11-12' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2025-12-04' })
  @IsString()
  endDate: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  lastCalculatedAt: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}

export class CampaignDataDto {
  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  advertiser: string;

  @ApiProperty()
  @IsString()
  campaignName: string;

  @ApiProperty()
  @IsString()
  adGroup: string;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsNumber()
  targetHouseholds: number;

  @ApiProperty()
  @IsNumber()
  totalBudget: number;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsBoolean()
  isDeleted: boolean;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty()
  @IsUUID()
  createdBy: string;

  @ApiProperty()
  @IsUUID()
  updatedBy: string;
}

export class BulkUpsertCampaignMetricsDto {
  @ApiProperty()
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ type: CampaignDataDto })
  @ValidateNested()
  @Type(() => CampaignDataDto)
  campaign: CampaignDataDto;

  @ApiProperty({ type: [PerformanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformanceRecordDto)
  performanceRecords: PerformanceRecordDto[];

  @ApiProperty({ type: [TimeDistributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDistributionDto)
  timeDistribution: TimeDistributionDto[];

  @ApiProperty({ type: ReachMetricsDto })
  @ValidateNested()
  @Type(() => ReachMetricsDto)
  reachMetrics: ReachMetricsDto;

  @ApiProperty({ type: CampaignSummaryDto })
  @ValidateNested()
  @Type(() => CampaignSummaryDto)
  campaignSummary: CampaignSummaryDto;
}
