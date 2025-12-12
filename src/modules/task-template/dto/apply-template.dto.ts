import { IsUUID, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyTemplateDto {
  @ApiProperty({
    description: 'Template ID to apply',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  template_id: string;

  @ApiProperty({
    description: 'Related campaign ID (for campaign templates)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  related_campaign_id?: string;

  @ApiProperty({
    description: 'Related creative ID (for creative templates)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsUUID()
  related_creative_id?: string;

  @ApiProperty({
    description: 'User ID to assign tasks to',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsNotEmpty()
  assigned_user_id: string;

  @ApiProperty({
    description: 'Base date to calculate due dates from (ISO 8601 format)',
    example: '2025-12-15',
  })
  @IsDateString()
  @IsNotEmpty()
  base_date: string;
}
