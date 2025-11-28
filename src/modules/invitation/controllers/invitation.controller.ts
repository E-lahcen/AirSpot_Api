import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { InviteUserDto } from '../dto';
import { AuthGuard, RolesGuard } from '@app/modules/auth/guards';
import {
  Roles,
  CurrentUser,
  AuthenticatedUser,
} from '@app/modules/auth/decorators';
import { UserService } from '@app/modules/user/services/user.service';
import { TenantService } from '@app/modules/tenant/services/tenant.service';
import { EmailService } from '../services/email.service';

@Controller('invitations')
@UseGuards(AuthGuard, RolesGuard)
export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Send an invitation (owner/admin only)
   */
  @Post()
  @Roles('owner', 'admin')
  async inviteUser(
    @Body() dto: InviteUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Get the current user details
    const dbUser = await this.userService.findByFirebaseUid(user.firebase_uid);
    if (!dbUser) {
      throw new Error('User not found');
    }

    // Create invitation
    const invitation = await this.invitationService.createInvitation(
      dto,
      dbUser.id,
    );

    // Get tenant info for email
    // const tenantId = this.tenantService.getTenantId();

    // Send invitation email
    await this.emailService.sendInvitationEmail(
      invitation,
      dbUser.company_name, // tenant name
      `${dbUser.first_name} ${dbUser.last_name}`, // inviter name
    );

    return {
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        type: invitation.type,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expires_at,
      },
    };
  }

  /**
   * Get all invitations (owner/admin only)
   */
  @Get()
  @Roles('owner', 'admin')
  async getInvitations() {
    const invitations = await this.invitationService.getAllInvitations();
    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        type: inv.type,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      })),
    };
  }

  /**
   * Get pending invitations (owner/admin only)
   */
  @Get('pending')
  @Roles('owner', 'admin')
  async getPendingInvitations() {
    const invitations = await this.invitationService.getPendingInvitations();
    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        type: inv.type,
        role: inv.role,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      })),
    };
  }

  /**
   * Revoke an invitation (owner/admin only)
   */
  @Delete(':id')
  @Roles('owner', 'admin')
  async revokeInvitation(@Param('id') id: string) {
    await this.invitationService.revokeInvitation(id);
    return {
      message: 'Invitation revoked successfully',
    };
  }
}
