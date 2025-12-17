import { Entity, Column, ManyToOne, ManyToMany, JoinColumn } from 'typeorm';
import { AdVariation } from '../../ad-variation/entities/ad-variation.entity';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';

export enum TargetType {
  DEMOGRAPHIC = 'Demographic',
  INTEREST = 'Interest',
  GEOGRAPHY = 'Geography',
  BEHAVIOR = 'Behavior',
  CHANNEL = 'Channel',
  DELIVERY_TIME = 'Delivery Time',
}

@Entity('audiences')
export class Audience extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid', nullable: true })
  variation_id: string;

  @Column({
    type: 'enum',
    enum: TargetType,
  })
  type: TargetType;

  @Column({ type: 'int', nullable: true })
  provider_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  target_id: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => AdVariation, (variation) => variation.audiences, {
    nullable: true,
  })
  @JoinColumn({ name: 'variation_id' })
  ad_variation: AdVariation;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  size: string;

  @Column({ type: 'varchar', length: 255 })
  reached: string;

  @Column({ type: 'json', nullable: true })
  platforms: string[];

  @Column({ type: 'json', nullable: true })
  campaigns: number;

  @Column({ type: 'json', nullable: true })
  selected_locations: string[];

  @Column({ type: 'json', nullable: true })
  selected_interests: string[];

  @Column({ type: 'json', nullable: true })
  age_range: number[];

  @Column({ type: 'json', nullable: true })
  selected_genders: string[];

  @ManyToMany(() => Campaign, (campaign) => campaign.audiences, {
    nullable: true,
  })
  campaigns_relation: Campaign[] | null;
}
