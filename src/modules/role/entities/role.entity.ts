import { BaseEntity } from '@app/common/entities/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;
}
