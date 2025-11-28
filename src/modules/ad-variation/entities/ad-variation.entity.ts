import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Creative } from '../../creative/entities/creative.entity';
import { Audience } from '../../audience/entities/audience.entity';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';

export enum BiddingStrategy {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL_CPM = 'MANUAL_CPM',
}

@Entity('ad_variations')
export class AdVariation extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid' })
  campaign_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  creative_id: string | null;

  @Column({
    type: 'enum',
    enum: BiddingStrategy,
    default: BiddingStrategy.AUTOMATIC,
  })
  bidding_strategy: BiddingStrategy;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cpm_bid: number | null;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Campaign, (campaign) => campaign.ad_variations)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @ManyToOne(() => Creative, (creative) => creative.ad_variations, {
    nullable: true,
  })
  @JoinColumn({ name: 'creative_id' })
  creative: Creative | null;

  @OneToMany(() => Audience, (audience) => audience.ad_variation)
  audiences: Audience[];
}
