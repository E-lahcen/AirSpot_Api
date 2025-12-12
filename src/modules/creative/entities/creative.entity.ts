import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AdVariation } from '../../ad-variation/entities/ad-variation.entity';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';
import { Task } from '../../task/entities/task.entity';

@Entity('creatives')
export class Creative extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  orientation: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  theme: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  video_position: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  price: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  product_name: string | null;

  // store features as text array (Postgres). If using other DBs, adjust accordingly.
  @Column('text', { array: true, nullable: true })
  features: string[] | null;

  @Column({ type: 'boolean', default: false })
  show_qr_code: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  qr_code_text: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_path: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  product_image_path: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  video_path: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  template_image_path: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 500 })
  file_name: string;

  @Column({ type: 'int', default: 0 })
  campaign_count: number;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => AdVariation, (variation) => variation.creative)
  ad_variations: AdVariation[];

  @OneToMany(() => Task, (task) => task.creative)
  tasks: Task[];
}
