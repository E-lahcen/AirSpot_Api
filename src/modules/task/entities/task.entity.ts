import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@app/common/entities/base.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Creative } from '../../creative/entities/creative.entity';
import { User } from '../../user/entities/user.entity';

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  related_campaign_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  related_creative_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_user_id: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ type: 'date', nullable: true })
  due_date: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_updated: Date;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_campaign_id' })
  campaign: Campaign | null;

  @ManyToOne(() => Creative, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'related_creative_id' })
  creative: Creative | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assigned_user: User | null;
}
