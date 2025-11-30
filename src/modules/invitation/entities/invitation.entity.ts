import { BaseEntity } from "@app/common/entities/base.entity";
import { Role } from "@app/modules/role/entities/role.entity";
import { User } from "@app/modules/user/entities/user.entity";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  REVOKED = "revoked",
}

export enum InvitationType {
  TENANT_REGISTRATION = "tenant_registration", // Join and register to a tenant
  COLLABORATION = "collaboration", // Join an existing project/workspace
  ROLE_ASSIGNMENT = "role_assignment", // Change user role
  RESOURCE_ACCESS = "resource_access", // Access to specific resource
  EVENT_PARTICIPATION = "event_participation", // Join an event
  DOCUMENT_REVIEW = "document_review", // Review/approve a document
}

@Entity("invitations")
export class Invitation extends BaseEntity {
  @Column()
  email: string;

  @Column({ type: "uuid" })
  invitor_id: string;

  @Column({
    name: "type",
    type: "enum",
    enum: InvitationType,
    default: InvitationType.TENANT_REGISTRATION,
  })
  type: InvitationType;

  @Column({ type: "uuid" })
  tenant_id: string;

  @Column()
  tenant_slug: string;

  @Column({ type: "uuid", nullable: true })
  role_id?: string;

  @ManyToOne(() => Role, { eager: true, nullable: true })
  @JoinColumn({ name: "role_id" })
  role?: Role;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "invitor_id" })
  invitor: User;

  @Column({
    name: "status",
    type: "enum",
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ unique: true })
  token: string;

  @Column()
  expires_at: Date;

  @Column({ name: "metadata", type: "jsonb", nullable: true })
  metadata: Record<string, any>; // Flexible data for different invitation types
}
