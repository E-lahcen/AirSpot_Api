import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'slug', type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  company_name: string;

  @Column({ name: 'schema_name', type: 'varchar', length: 100, unique: true })
  schema_name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'owner_email', type: 'varchar', length: 255 })
  owner_email: string;

  // Logical reference to user ID in tenant schema (no FK constraint)
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  owner_id: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  created_by_id?: string;

  @Column({ name: 'members_count', type: 'int', default: 0 })
  members_count: number;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  logo?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string | null;

  @Column({ name: 'default_role', type: 'varchar', length: 50, nullable: true })
  default_role?: string | null;

  @Column({ name: 'enforce_domain', type: 'boolean', default: false })
  enforce_domain: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string | null;

  @Column({
    name: 'firebase_tenant_id',
    type: 'varchar',
    length: 128,
    unique: true,
    nullable: true,
  })
  firebase_tenant_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
