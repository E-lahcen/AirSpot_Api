import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import {
  Invitation,
  InvitationStatus,
  InvitationType,
} from '../entities/invitation.entity';
import { InviteUserDto } from '../dto';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  /**
   * Create an invitation
   */
  async createInvitation(
    dto: InviteUserDto,
    invitedBy: string,
  ): Promise<Invitation> {
    const manager = await this.tenantConnection.getEntityManager();

    // Check if there's already a pending invitation for this email
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    const existingInvitation = await invitationRepo.findOne({
      where: {
        email: dto.email,
        status: InvitationStatus.PENDING,
        type: dto.type || InvitationType.TENANT_REGISTRATION,
      },
    });

    if (existingInvitation) {
      throw new ConflictException({
        message: 'Invitation already exists',
        errors: [
          {
            code: 'INVITATION_EXISTS',
            message: 'A pending invitation for this email already exists',
          },
        ],
      });
    }

    // Generate secure token
    const token = this.generateToken();

    // Set expiration (7 days from now by default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = manager.create(Invitation, {
      email: dto.email,
      invited_by: invitedBy,
      type: dto.type || InvitationType.TENANT_REGISTRATION,
      role: dto.role || 'member',
      status: InvitationStatus.PENDING,
      token,
      expires_at: expiresAt,
      metadata: dto.metadata || {},
    });

    return manager.save(Invitation, invitation);
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    const invitation = await invitationRepo.findOne({ where: { token } });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if expired
    if (new Date() > invitation.expires_at) {
      invitation.status = InvitationStatus.EXPIRED;
      await invitationRepo.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    // Check if already accepted
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is ${invitation.status.toLowerCase()}`,
      );
    }

    return invitation;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string): Promise<Invitation> {
    const invitation = await this.getInvitationByToken(token);
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);

    invitation.status = InvitationStatus.ACCEPTED;
    return invitationRepo.save(invitation);
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    const invitation = await invitationRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.REVOKED;
    await invitationRepo.save(invitation);
  }

  /**
   * Get all pending invitations
   */
  async getPendingInvitations(): Promise<Invitation[]> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    return invitationRepo.find({
      where: { status: InvitationStatus.PENDING },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get invitations by type
   */
  async getInvitationsByType(type: InvitationType): Promise<Invitation[]> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    return invitationRepo.find({
      where: { type },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get all invitations (for admin)
   */
  async getAllInvitations(): Promise<Invitation[]> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    return invitationRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Generate secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
