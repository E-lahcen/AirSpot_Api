import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@app/common/dtos';
import {
  CampaignGoal,
  CampaignStatus,
  BudgetType,
} from '../entities/campaign.entity';

export class FilterCampaignDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by campaign name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: CampaignGoal, description: 'Filter by goal' })
  @IsOptional()
  @IsEnum(CampaignGoal)
  goal?: CampaignGoal;

  @ApiPropertyOptional({
    enum: CampaignStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    enum: BudgetType,
    description: 'Filter by budget type',
  })
  @IsOptional()
  @IsEnum(BudgetType)
  budget_type?: BudgetType;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsOptional()
  @IsUUID()
  owner_id?: string;
}
