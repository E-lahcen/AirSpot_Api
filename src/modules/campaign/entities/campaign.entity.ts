import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AdVariation } from '../../ad-variation/entities/ad-variation.entity';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';
import { Task } from '../../task/entities/task.entity';

export enum CampaignGoal {
  AWARENESS = 'AWARENESS',
  CONVERSIONS = 'CONVERSIONS',
  TRAFFIC = 'TRAFFIC',
  RETARGET = 'RETARGET',
  APP_REVENUE = 'APP_REVENUE',
}

export enum BudgetType {
  LIFETIME = 'LIFETIME',
  DAILY = 'DAILY',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

@Entity('campaigns')
export class Campaign extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CampaignGoal,
  })
  goal: CampaignGoal;

  @Column({
    type: 'enum',
    enum: BudgetType,
  })
  budget_type: BudgetType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  budget_amount: number;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date | null;

  // Additional fields to match CreateCampaignDto
  @Column({ type: 'jsonb', nullable: true })
  selected_days: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  audience: {
    locations: string[];
    interests: string[];
    demographics: number[];
    genders: string[];
  } | null;

  @Column('text', { array: true, nullable: true })
  selected_broadcast_tv: string[] | null;

  @Column('text', { array: true, nullable: true })
  selected_streaming: string[] | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bidding_strategy: string | null;

  @Column({ type: 'jsonb', nullable: true })
  creative_data: Record<string, any> | null;

  // Metrics fields
  @Column({ type: 'integer', default: 0 })
  impressions: number;

  @Column({ type: 'integer', default: 0 })
  reach: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  spend: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  roi: string | null;

  @OneToMany(() => AdVariation, (variation) => variation.campaign)
  ad_variations: AdVariation[];

  @OneToMany(() => Task, (task) => task.campaign)
  tasks: Task[];
}
