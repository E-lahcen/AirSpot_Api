import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum InvitationType {
  TENANT_REGISTRATION = 'tenant_registration', // Join and register to a tenant
  COLLABORATION = 'collaboration', // Join an existing project/workspace
  ROLE_ASSIGNMENT = 'role_assignment', // Change user role
  RESOURCE_ACCESS = 'resource_access', // Access to specific resource
  EVENT_PARTICIPATION = 'event_participation', // Join an event
  DOCUMENT_REVIEW = 'document_review', // Review/approve a document
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'invited_by', type: 'uuid' })
  invited_by: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: InvitationType,
    default: InvitationType.TENANT_REGISTRATION,
  })
  type: InvitationType;

  @Column({ name: 'role', type: 'varchar', length: 50, default: 'member' })
  role: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ name: 'token', type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expires_at: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Flexible data for different invitation types

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
