import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AdVariation } from '../../ad-variation/entities/ad-variation.entity';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';

@Entity('creatives')
export class Creative extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500 })
  file_name: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'varchar', length: 255, default: 'airspot-ctv-assets' })
  s3_bucket: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_s3_key: string | null;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => AdVariation, (variation) => variation.creative)
  ad_variations: AdVariation[];
}
