import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@app/common/entities/base.entity';
import { User } from '@app/modules/user/entities/user.entity';

@Entity('storyboards')
export class Storyboard extends BaseEntity {
  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  duration: string;

  @Column({ type: 'text' })
  scenes: string;

  @Column({ type: 'jsonb' })
  scenes_data: any;

  @Column({ type: 'varchar', length: 500 })
  video_url: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
