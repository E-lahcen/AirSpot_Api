import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard, RolesGuard } from '@app/modules/auth/guards';
import {
  Roles,
  CurrentUser,
  AuthenticatedUser,
} from '@app/modules/auth/decorators';
import { TenantService } from '../services/tenant.service';
import { TenantManagementService } from '../services/tenant-management.service';
import { UserService } from '@app/modules/user/services/user.service';
import { RoleService } from '@app/modules/role/services/role.service';
import { InviteMemberDto, UpdateMemberRoleDto } from '../dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(AuthGuard, RolesGuard)
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantManagementService: TenantManagementService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get current user's organization" })
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        slug: { type: 'string', example: 'acme-corporation' },
        company_name: { type: 'string', example: 'Acme Corporation' },
        owner_id: { type: 'string', format: 'uuid' },
        is_active: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getCurrentOrganization(@CurrentUser() user: AuthenticatedUser) {
    const tenantSlug = user.slug || this.tenantService.getSlug();
    if (!tenantSlug) {
      throw new NotFoundException({
        message: 'Tenant not found',
        errors: [
          {
            code: 'TENANT_NOT_FOUND',
            message: 'Unable to determine tenant for current user',
          },
        ],
      });
    }

    const tenant = await this.tenantManagementService.findBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException({
        message: 'Tenant not found',
        errors: [
          {
            code: 'TENANT_NOT_FOUND',
            message: `No tenant found with slug: ${tenantSlug}`,
          },
        ],
      });
    }

    return tenant;
  }

  @Get('members')
  @ApiOperation({ summary: 'Get all members of the organization' })
  @ApiResponse({
    status: 200,
    description: 'List of organization members',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string' },
          full_name: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          company_name: { type: 'string' },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @Roles('owner', 'admin')
  async getMembers() {
    const users = await this.userService.findAllUsers();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name,
      company_name: user.company_name,
      roles: user.roles,
      created_at: user.created_at,
    }));
  }

  @Post('members/invite')
  @ApiOperation({ summary: 'Invite a user to the organization' })
  @ApiResponse({
    status: 201,
    description: 'Invitation sent successfully',
  })
  @Roles('owner', 'admin')
  async inviteMember(
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebase_uid);
    if (!dbUser) {
      throw new NotFoundException({
        message: 'User not found',
        errors: [
          {
            code: 'USER_NOT_FOUND',
            message: 'Current user not found in database',
          },
        ],
      });
    }

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException({
        message: 'User already exists',
        errors: [
          {
            code: 'USER_EXISTS',
            message: 'User already exists in this organization',
          },
        ],
      });
    }

    // Validate role - only admin or member can be assigned via invitation
    const assignedRole = dto.role || 'member';
    if (assignedRole === 'owner') {
      throw new BadRequestException({
        message: 'Invalid role',
        errors: [
          {
            code: 'INVALID_ROLE',
            message:
              'Owner role cannot be assigned via invitation. Only "admin" or "member" roles are allowed.',
          },
        ],
      });
    }

    // // Create invitation
    // const invitation = await this.invitationService.createInvitation(
    //   {
    //     email: dto.email,
    //     role: assignedRole,
    //     type: InvitationType.COLLABORATION,
    //   },
    //   dbUser.id,
    // );

    // // Send invitation email
    // await this.emailService.sendInvitationEmail(
    //   invitation,
    //   dbUser.company_name,
    //   `${dbUser.first_name || ""} ${dbUser.last_name || ""}`.trim() ||
    //     dbUser.full_name ||
    //     "Admin",
    // );

    // return {
    //   message: "Invitation sent successfully",
    //   invitation: {
    //     id: invitation.id,
    //     email: invitation.email,
    //     role: invitation.role,
    //     status: invitation.status,
    //     expires_at: invitation.expires_at,
    //   },
    // };
  }

  @Patch('members/:id/role')
  @ApiOperation({ summary: "Update a member's role" })
  @ApiResponse({
    status: 200,
    description: 'Member role updated successfully',
  })
  @Roles('owner', 'admin')
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (dto.role === 'super_admin') {
      throw new BadRequestException({
        message: 'Invalid role assignment',
        errors: [
          {
            code: 'INVALID_ROLE',
            message: 'super_admin role cannot be assigned via endpoint',
          },
        ],
      });
    }

    // Get the role
    const role = await this.roleService.findByName(dto.role);
    if (!role) {
      throw new NotFoundException({
        message: 'Role not found',
        errors: [
          {
            code: 'ROLE_NOT_FOUND',
            message: `Role '${dto.role}' not found`,
          },
        ],
      });
    }

    // Prevent changing owner role (only owner can change owner)
    const dbUser = await this.userService.findByFirebaseUid(user.firebase_uid);
    if (!dbUser) {
      throw new NotFoundException({
        message: 'User not found',
        errors: [
          {
            code: 'USER_NOT_FOUND',
            message: 'Current user not found in database',
          },
        ],
      });
    }

    const member = await this.userService.findById(memberId);
    if (!member) {
      throw new NotFoundException({
        message: 'Member not found',
        errors: [
          {
            code: 'MEMBER_NOT_FOUND',
            message: 'Member not found in this organization',
          },
        ],
      });
    }

    // Check if trying to change owner role
    const isOwner = member.roles.some((r) => r.name === 'owner');
    const isCurrentUserOwner = dbUser.roles.some((r) => r.name === 'owner');

    if (isOwner && !isCurrentUserOwner) {
      throw new BadRequestException({
        message: 'Permission denied',
        errors: [
          {
            code: 'PERMISSION_DENIED',
            message: 'Only owner can change owner role',
          },
        ],
      });
    }

    // Prevent removing owner role if it's the only owner
    if (isOwner && dto.role !== 'owner') {
      const allUsers = await this.userService.findAllUsers();
      const ownerCount = allUsers.filter((u) =>
        u.roles.some((r) => r.name === 'owner'),
      ).length;

      if (ownerCount === 1) {
        throw new BadRequestException({
          message: 'Cannot remove owner',
          errors: [
            {
              code: 'CANNOT_REMOVE_OWNER',
              message: 'Cannot remove the only owner from the organization',
            },
          ],
        });
      }
    }

    // Update user roles
    await this.userService.updateUserRoles(memberId, [role]);

    const updatedMember = await this.userService.findById(memberId);
    return {
      message: 'Member role updated successfully',
      member: {
        id: updatedMember.id,
        email: updatedMember.email,
        full_name: updatedMember.full_name,
        roles: updatedMember.roles,
      },
    };
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  @Roles('owner', 'admin')
  async removeMember(
    @Param('id', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebase_uid);
    if (!dbUser) {
      throw new NotFoundException({
        message: 'User not found',
        errors: [
          {
            code: 'USER_NOT_FOUND',
            message: 'Current user not found in database',
          },
        ],
      });
    }

    const member = await this.userService.findById(memberId);
    if (!member) {
      throw new NotFoundException({
        message: 'Member not found',
        errors: [
          {
            code: 'MEMBER_NOT_FOUND',
            message: 'Member not found in this organization',
          },
        ],
      });
    }

    // Prevent removing owner
    const isOwner = member.roles.some((r) => r.name === 'owner');
    if (isOwner) {
      throw new BadRequestException({
        message: 'Cannot remove owner',
        errors: [
          {
            code: 'CANNOT_REMOVE_OWNER',
            message: 'Cannot remove the owner from the organization',
          },
        ],
      });
    }

    // Prevent removing yourself
    if (member.id === dbUser.id) {
      throw new BadRequestException({
        message: 'Cannot remove yourself',
        errors: [
          {
            code: 'CANNOT_REMOVE_SELF',
            message: 'Cannot remove yourself from the organization',
          },
        ],
      });
    }

    await this.userService.removeUser(memberId);

    return {
      message: 'Member removed successfully',
    };
  }
}
