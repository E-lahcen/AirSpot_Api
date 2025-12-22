import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('reach_metrics')
@Index(['tenantId', 'campaignId'], { unique: true })
export class ReachMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  campaignId: string;

  @Column({ type: 'bigint' })
  totalImpressions: number;

  @Column({ type: 'decimal', precision: 12, scale: 1 })
  uniqueHouseholds: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  frequencyPerHousehold: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations (optional - no FK constraint for importing external data)
  @OneToOne(() => Campaign, (campaign) => campaign.reachMetrics, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'campaignId' })
  campaign?: Campaign;
}
