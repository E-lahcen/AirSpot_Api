import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AdVariation } from '../../ad-variation/entities/ad-variation.entity';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';

export enum TargetType {
  DEMOGRAPHIC = 'DEMOGRAPHIC',
  INTEREST = 'INTEREST',
  GEOGRAPHY = 'GEOGRAPHY',
  BEHAVIOR = 'BEHAVIOR',
  CHANNEL = 'CHANNEL',
  DELIVERY_TIME = 'DELIVERY_TIME',
}

@Entity('target_group_selections')
export class Audience extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid' })
  variation_id: string;

  @Column({
    type: 'enum',
    enum: TargetType,
  })
  type: TargetType;

  @Column({ type: 'int' })
  provider_id: number;

  @Column({ type: 'varchar', length: 255 })
  target_id: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => AdVariation, (variation) => variation.audiences)
  @JoinColumn({ name: 'variation_id' })
  ad_variation: AdVariation;
}
