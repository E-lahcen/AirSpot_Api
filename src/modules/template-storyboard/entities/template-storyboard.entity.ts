import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@app/common/entities/base.entity';

@Entity('template_storyboards')
export class TemplateStoryboard extends BaseEntity {
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

  @Column('text', { array: true, nullable: true })
  imageHistory: string[] | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  industry: string;
}
