import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatus, Priority } from '../entities/task.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task name', example: 'Review campaign assets' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Review all creative assets for the new campaign',
  })
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Related campaign ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @IsUUID()
  @IsOptional()
  related_campaign_id?: string;

  @ApiPropertyOptional({
    description: 'Related creative ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @IsUUID()
  @IsOptional()
  related_creative_id?: string;

  @ApiPropertyOptional({
    description: 'Assigned user ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @IsUUID()
  @IsOptional()
  assigned_user_id?: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: Priority,
    example: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Due date (ISO 8601 format)',
    example: '2025-12-31',
  })
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({
    description: 'Last updated timestamp (ISO 8601 format)',
    example: '2025-12-12T10:30:00.000Z',
  })
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @IsDateString()
  @IsOptional()
  last_updated?: string;
}
