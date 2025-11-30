import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { TenantConnectionService } from "@app/modules/tenant/services/tenant-connection.service";
import {
  Invitation,
  InvitationStatus,
  InvitationType,
} from "../entities/invitation.entity";
import { CreateInvitationDto } from "../dto/create-invitation";
import { AcceptInvitationDto } from "../dto/accept-invitation.dto";
import { AcceptInvitationResponseDto } from "../dto/accept-invitation-response.dto";
import { FilterInvitationDto } from "../dto/filter-invitation.dto";
import { randomBytes } from "crypto";
import { InvitationTemplateService } from "./invitation-template.service";
import { EmailService } from "@app/modules/notification/services/email.service";
import { AuthenticatedUser } from "@app/modules/auth/decorators";
import { TenantManagementService } from "@app/modules/tenant/services/tenant-management.service";
import { RoleService } from "@app/modules/role/services/role.service";
import { Role } from "@app/modules/role/entities/role.entity";
import { AuthService } from "@app/modules/auth/services/auth.service";
import { paginate, Pagination } from "nestjs-typeorm-paginate";
import { FindOptionsWhere } from "typeorm";

@Injectable()
export class InvitationService {
  constructor(
    private readonly tenantConnection: TenantConnectionService,
    private readonly invitationTemplateService: InvitationTemplateService,
    private readonly emailService: EmailService,
    private readonly tenantManagementService: TenantManagementService,
    private readonly roleService: RoleService,
    private readonly authService: AuthService,
  ) {}

  async getInvitationRole(roleId?: string): Promise<Role> {
    let role: Role | undefined;
    if (roleId) {
      role = await this.roleService.findById(roleId);
      if (!role) {
        throw new NotFoundException({
          message: "Role not found",
          errors: [
            {
              code: "ROLE_NOT_FOUND",
              message: "The role specified in the invitation does not exist",
            },
          ],
        });
      }
    } else {
      // Default to member role
      role = await this.roleService.findByName("member");
      if (!role) {
        throw new NotFoundException({
          message: "Member role not found",
          errors: [
            {
              code: "ROLE_NOT_FOUND",
              message: "Default member role does not exist",
            },
          ],
        });
      }
    }
    return role;
  }

  /**
   * Create an invitation
   */
  async createInvitation(
    invitor: AuthenticatedUser,
    createInvitationDto: CreateInvitationDto,
  ): Promise<Invitation> {
    const role = await this.getInvitationRole(createInvitationDto.role_id);

    const manager = await this.tenantConnection.getEntityManager();

    return manager.transaction(async (transactionalManager) => {
      const repo = transactionalManager.getRepository(Invitation);

      // Check if there's already a pending invitation for this email
      const existingInvitation = await repo.findOne({
        where: {
          email: createInvitationDto.email,
          status: InvitationStatus.PENDING,
          type: createInvitationDto.type,
        },
      });

      if (existingInvitation) {
        throw new ConflictException({
          message: "Invitation already exists",
          errors: [
            {
              code: "INVITATION_EXISTS",
              message: "A pending invitation for this email already exists",
            },
          ],
        });
      }

      // Generate secure token
      const token = this.generateToken();

      // Set expiration (7 days from now by default)
      const expiresIn = createInvitationDto.expires_in || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      const invitation = repo.create({
        email: createInvitationDto.email,
        invitor_id: invitor.id,
        type: createInvitationDto.type,
        role_id: role.id,
        tenant_id: invitor.tenantId,
        tenant_slug: invitor.slug,
        status: InvitationStatus.PENDING,
        token,
        expires_at: expiresAt,
        metadata: createInvitationDto.metadata || {},
      });

      const savedInvitation = await repo.save(invitation);

      const emailTemplate =
        this.invitationTemplateService.generateInvitationEmail(savedInvitation);

      await this.emailService.send(emailTemplate);

      return savedInvitation;
    });
  }

  // /**
  //  * Get invitation by token
  //  */
  async getInvitationByToken(token: string): Promise<Invitation> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);

    const invitation = await invitationRepo.findOne({ where: { token } });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    // Check if expired
    if (new Date() > invitation.expires_at) {
      invitation.status = InvitationStatus.EXPIRED;
      await invitationRepo.save(invitation);
      throw new BadRequestException("Invitation has expired");
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
   * Accept an invitation - Generic handler that routes to specific handlers
   */
  async acceptInvitation(
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    const invitation = await this.getInvitationByToken(
      acceptInvitationDto.token,
    );

    // Route to appropriate handler based on invitation type
    switch (invitation.type) {
      case InvitationType.TENANT_REGISTRATION:
        return this.handleTenantRegistration(invitation, acceptInvitationDto);

      case InvitationType.COLLABORATION:
      case InvitationType.ROLE_ASSIGNMENT:
      case InvitationType.RESOURCE_ACCESS:
      case InvitationType.EVENT_PARTICIPATION:
      case InvitationType.DOCUMENT_REVIEW:
        throw new BadRequestException({
          message: "Invitation type not yet implemented",
          errors: [
            {
              code: "NOT_IMPLEMENTED",
              message: `Handling for ${invitation.type} is not yet implemented`,
            },
          ],
        });

      default:
        throw new BadRequestException({
          message: "Unknown invitation type",
          errors: [
            {
              code: "UNKNOWN_TYPE",
              message: "This invitation type is not recognized",
            },
          ],
        });
    }
  }

  /**
   * Handle tenant registration invitation acceptance
   */
  private async handleTenantRegistration(
    invitation: Invitation,
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    // Validate required fields for registration
    if (
      !acceptInvitationDto.password ||
      !acceptInvitationDto.first_name ||
      !acceptInvitationDto.last_name
    ) {
      throw new BadRequestException({
        message: "Missing required fields for registration",
        errors: [
          {
            code: "MISSING_FIELDS",
            message:
              "first_name, last_name, and password are required for tenant registration",
          },
        ],
      });
    }

    // Get tenant information using slug from invitation
    const tenant = await this.tenantManagementService.findBySlug(
      invitation.tenant_slug,
    );
    if (!tenant) {
      throw new NotFoundException({
        message: "Tenant not found",
        errors: [
          {
            code: "TENANT_NOT_FOUND",
            message:
              "The tenant associated with this invitation no longer exists",
          },
        ],
      });
    }

    // Check if tenant is active
    if (!tenant.is_active) {
      throw new BadRequestException({
        message: "Tenant is inactive",
        errors: [
          {
            code: "TENANT_INACTIVE",
            message: "This tenant account has been deactivated",
          },
        ],
      });
    }

    try {
      // Get the role for the user (from invitation or default to member)
      const role = await this.getInvitationRole(invitation.role_id);

      // Use shared method from AuthService to create the user
      const { user, accessToken } = await this.authService.createTenantUser({
        email: invitation.email,
        password: acceptInvitationDto.password,
        firstName: acceptInvitationDto.first_name,
        lastName: acceptInvitationDto.last_name,
        fullName:
          acceptInvitationDto.name ||
          `${acceptInvitationDto.first_name} ${acceptInvitationDto.last_name}`,
        tenant,
        role,
      });

      // Mark invitation as accepted
      const invitationRepo =
        await this.tenantConnection.getRepository(Invitation);
      invitation.status = InvitationStatus.ACCEPTED;
      await invitationRepo.save(invitation);

      return {
        access_token: accessToken,
        user,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          company_name: tenant.company_name,
          firebase_tenant_id: tenant.firebase_tenant_id,
        },
      };
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle unknown errors
      throw new BadRequestException({
        message: "Failed to accept invitation",
        errors: [
          {
            code: "INVITATION_ACCEPTANCE_FAILED",
            message:
              error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      });
    }
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    const invitation = await this.findById(invitationId);

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    invitation.status = InvitationStatus.REVOKED;
    await invitationRepo.save(invitation);
  }

  /**
   * Resend an invitation (for expired or pending invitations)
   */
  async resendInvitation(invitationId: string): Promise<Invitation> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    const invitation = await this.findById(invitationId);

    // Only allow resending for pending or expired invitations
    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.EXPIRED
    ) {
      throw new BadRequestException({
        message: "Invitation cannot be resent",
        errors: [
          {
            code: "INVALID_STATUS",
            message: `Only pending or expired invitations can be resent. Current status: ${invitation.status}`,
          },
        ],
      });
    }

    // Generate new token
    const newToken = this.generateToken();

    // Set new expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invitation
    invitation.token = newToken;
    invitation.expires_at = expiresAt;
    invitation.status = InvitationStatus.PENDING;

    const updatedInvitation = await invitationRepo.save(invitation);

    // Send email with new invitation
    const emailTemplate =
      this.invitationTemplateService.generateInvitationEmail(updatedInvitation);

    await this.emailService.send(emailTemplate);

    return updatedInvitation;
  }

  /**
   * Get all invitations with optional filters
   */
  async findAll(
    filters?: FilterInvitationDto,
  ): Promise<Pagination<Invitation>> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);

    const where: FindOptionsWhere<Invitation> = {};

    if (filters?.email) {
      where.email = filters.email;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.invitor_id) {
      where.invitor_id = filters.invitor_id;
    }

    if (filters?.role_id) {
      where.role_id = filters.role_id;
    }

    return paginate<Invitation>(
      invitationRepo,
      {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
      },
      { where, relations: ["invitor", "role"], order: { created_at: "DESC" } },
    );
  }

  /**
   * Get invitation by ID
   */
  async findById(invitationId: string): Promise<Invitation> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    const invitation = await invitationRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException({
        message: "Invitation not found",
        errors: [
          {
            code: "INVITATION_NOT_FOUND",
            message: "No invitation found with the specified ID",
          },
        ],
      });
    }

    return invitation;
  }

  /**
   * Delete an invitation
   */
  async deleteInvitation(invitationId: string): Promise<void> {
    const invitationRepo =
      await this.tenantConnection.getRepository(Invitation);
    const invitation = await this.findById(invitationId);
    await invitationRepo.remove(invitation);
  }

  // /**
  //  * Generate secure random token
  //  */
  private generateToken(): string {
    const random = randomBytes(32).toString("hex");
    return `${random}${Date.now()}`; // Append timestamp for uniqueness
  }
}
