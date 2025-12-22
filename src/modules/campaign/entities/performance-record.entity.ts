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

@Entity('performance_records')
@Index(['tenantId', 'campaignId'])
@Index(['tenantId', 'campaignId', 'date'])
@Index(['tenantId', 'campaignId', 'publisherName'])
export class PerformanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  campaignId: string;

  @Column({ type: 'date' })
  date: string; // Format: YYYY-MM-DD

  @Column({ type: 'varchar', length: 255 })
  publisherName: string;

  @Column({ type: 'bigint' })
  impressions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  spend: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  cpm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  vcr: number | null;

  @Column({ type: 'bigint', nullable: true })
  bids: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations (optional - no FK constraint for importing external data)
  @ManyToOne(() => Campaign, (campaign) => campaign.performanceRecords, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'campaignId' })
  campaign?: Campaign;
}
