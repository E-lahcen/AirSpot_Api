import { IsString, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignGoal, BudgetType } from '../entities/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: CampaignGoal, description: 'Campaign goal' })
  @IsEnum(CampaignGoal)
  goal: CampaignGoal;

  @ApiProperty({ enum: BudgetType, description: 'Budget type' })
  @IsEnum(BudgetType)
  budget_type: BudgetType;

  @ApiProperty({ description: 'Budget amount', example: 1000.0 })
  @IsNumber()
  @Min(0)
  budget_amount: number;

  @ApiProperty({
    description: 'Campaign start date',
    example: '2025-01-01T00:00:00Z',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    description: 'Campaign end date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  end_date: string;
}
