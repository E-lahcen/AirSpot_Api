import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';

@Entity('templates')
export class Template extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  orientation: 'vertical' | 'horizontal';

  @Column({ type: 'varchar', length: 100 })
  theme: string;

  @Column({ type: 'varchar', length: 50 })
  video_position: 'left' | 'right';

  @Column({ type: 'varchar', length: 255 })
  brand_name: string;

  @Column({ type: 'varchar', length: 50 })
  price: string;

  @Column({ type: 'varchar', length: 255 })
  product_name: string;

  @Column({ type: 'text', array: true, default: [] })
  features: string[];

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

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
