import { Role } from '@app/modules/role/entities/role.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', type: 'varchar', length: 255, nullable: true })
  first_name?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: true })
  last_name?: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  full_name?: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  company_name: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'firebase_uid', type: 'varchar', length: 128, unique: true })
  firebase_uid: string;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
