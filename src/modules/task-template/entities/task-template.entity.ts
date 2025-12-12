import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@app/common/entities/base.entity';
import { Priority } from '../../task/entities/task.entity';

export enum TaskType {
  CAMPAIGN = 'Campaign',
  CREATIVE = 'Creative',
}

export interface TaskTemplateItem {
  name: string;
  description: string;
  priority: Priority;
  daysUntilDue: number;
}

@Entity('task_templates')
export class TaskTemplate extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  task_type: TaskType;

  @Column({ type: 'jsonb' })
  tasks: TaskTemplateItem[];
}
