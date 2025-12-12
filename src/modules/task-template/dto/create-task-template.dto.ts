import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType, TaskTemplateItem } from '../entities/task-template.entity';
import { Priority } from '../../task/entities/task.entity';

export class TaskTemplateItemDto implements TaskTemplateItem {
  @ApiProperty({ description: 'Task name', example: 'Review creative brief' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Review and approve the creative brief document',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Task priority',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({
    description: 'Number of days until task is due',
    example: 3,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  daysUntilDue: number;
}

export class CreateTaskTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Standard Campaign Launch',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Task type (Campaign or Creative)',
    enum: TaskType,
    example: TaskType.CAMPAIGN,
  })
  @IsEnum(TaskType)
  task_type: TaskType;

  @ApiProperty({
    description: 'Array of task items in the template',
    type: [TaskTemplateItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskTemplateItemDto)
  tasks: TaskTemplateItemDto[];
}
