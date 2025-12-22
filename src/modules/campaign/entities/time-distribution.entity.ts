import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('time_distribution')
@Index(['tenantId', 'campaignId'])
@Index(['tenantId', 'campaignId', 'hour'])
export class TimeDistribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  campaignId: string;

  @Column({ type: 'integer' })
  hour: number; // 0-23

  @Column({ type: 'bigint' })
  impressions: number;

  @Column({ type: 'decimal', precision: 8, scale: 6 })
  percentage: number; // 0.0 - 1.0

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations (optional - no FK constraint for importing external data)
  @ManyToOne(() => Campaign, (campaign) => campaign.timeDistribution, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'campaignId' })
  campaign?: Campaign;
}
