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

@Entity('campaign_summaries')
@Index(['tenantId', 'campaignId'], { unique: true })
export class CampaignSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  campaignId: string;

  // Métriques pré-calculées
  @Column({ type: 'bigint' })
  totalImpressions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalSpend: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  averageCPM: number;

  @Column({ type: 'decimal', precision: 12, scale: 1 })
  uniqueHouseholds: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageFrequency: number;

  @Column({ type: 'integer' })
  totalPublishers: number;

  @Column({ type: 'integer' })
  activeDays: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'timestamp' })
  lastCalculatedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations (optional - no FK constraint for importing external data)
  @OneToOne(() => Campaign, (campaign) => campaign.summary, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'campaignId' })
  campaign?: Campaign;
}
