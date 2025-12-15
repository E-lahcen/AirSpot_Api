/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { UserTenant } from '@app/modules/user-tenant/entities/user-tenant.entity';
import {
  Invitation,
  InvitationStatus,
} from '@app/modules/invitation/entities/invitation.entity';
import { Tenant } from '@app/modules/tenant/entities/tenant.entity';
import {
  FilterUsersDto,
  UpdateUserStatusDto,
  UpdateUserRolesDto,
} from '../dto';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
  ) {}

  async getAllUsers(filterDto: FilterUsersDto): Promise<any> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const offset = (page - 1) * limit;

    // Get all tenants to query their schemas
    const tenants = await this.tenantRepository.find();
    const allUsers: any[] = [];

    // Query each tenant schema for users
    for (const tenant of tenants) {
      try {
        const schemaName = `tenant_${tenant.slug.replace(/-/g, '_')}`;

        let query = `
          SELECT u.*, 
                 COALESCE(
                   json_agg(
                     DISTINCT jsonb_build_object(
                       'id', r.id,
                       'name', r.name,
                       'description', r.description
                     )
                   ) FILTER (WHERE r.id IS NOT NULL),
                   '[]'::json
                 ) as roles
          FROM "${schemaName}".users u
          LEFT JOIN "${schemaName}".users_roles_roles urr ON u.id = urr.user_id
          LEFT JOIN "${schemaName}".roles r ON urr.role_id = r.id
          WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        // Apply search filter
        if (filterDto.search) {
          query += ` AND (u.email ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
          params.push(`%${filterDto.search}%`);
          paramIndex++;
        }

        // Apply role filter
        if (filterDto.role) {
          query += ` AND r.name = $${paramIndex}`;
          params.push(filterDto.role);
          paramIndex++;
        }

        query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

        const users = await this.dataSource.query(query, params);

        // Add tenant and user_tenant information
        for (const user of users) {
          // Get user_tenant info from public schema
          const userTenantInfo = await this.userTenantRepository.findOne({
            where: { user_id: user.id, tenant_id: tenant.id },
          });

          // Get ALL invitations for this email
          const invitations = await this.invitationRepository.find({
            where: { email: user.email },
            order: { created_at: 'DESC' },
          });

          allUsers.push({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: user.full_name,
            company_name: user.company_name,
            email: user.email,
            firebase_uid: user.firebase_uid,
            created_at: user.created_at,
            updated_at: user.updated_at,
            user_status: userTenantInfo
              ? 'active'
              : invitations.some(
                    (inv) => inv.status === InvitationStatus.PENDING,
                  )
                ? 'invited'
                : 'registered',
            tenants: [
              {
                id: tenant.id,
                slug: tenant.slug,
                company_name: tenant.company_name,
                status: tenant.status,
                user_email: userTenantInfo?.email || null,
              },
            ],
            invitations: invitations.map((inv) => ({
              id: inv.id,
              status: inv.status,
              type: inv.type,
              tenant_id: inv.tenant_id,
              tenant_slug: inv.tenant_slug,
              expires_at: inv.expires_at,
              created_at: inv.created_at,
            })),
            roles: user.roles || [],
            actions_available: {
              can_validate: !userTenantInfo,
              can_accept_invitation: invitations.some(
                (inv) => inv.status === InvitationStatus.PENDING,
              ),
              can_reject_invitation: invitations.some(
                (inv) => inv.status === InvitationStatus.PENDING,
              ),
              can_update_roles: !!userTenantInfo,
              can_update_status: !!userTenantInfo,
              can_delete: true,
            },
          });
        }
      } catch (error) {
        console.error(
          `Error fetching users from tenant ${tenant.slug}:`,
          error.message,
        );
      }
    }

    // Apply tenant filter if specified
    let filteredUsers = allUsers;
    if (filterDto.tenant_id) {
      filteredUsers = allUsers.filter((user) =>
        user.tenants.some((t: any) => t.id === filterDto.tenant_id),
      );
    }

    // Apply status filter
    if (filterDto.status) {
      filteredUsers = filteredUsers.filter(
        (user) => user.user_status === filterDto.status,
      );
    }

    // Manual pagination
    const totalItems = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      items: paginatedUsers,
      meta: {
        totalItems,
        itemCount: paginatedUsers.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
      summary: {
        total_users: totalItems,
        active_users: filteredUsers.filter((u) => u.user_status === 'active')
          .length,
        invited_users: filteredUsers.filter((u) => u.user_status === 'invited')
          .length,
        registered_users: filteredUsers.filter(
          (u) => u.user_status === 'registered',
        ).length,
      },
    };
  }

  async getUserById(id: string): Promise<any> {
    const query = `
      SELECT u.*, 
             t.id as tenant_id,
             t.slug as tenant_slug,
             t.company_name as tenant_company_name,
             json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name, 'description', r.description)) FILTER (WHERE r.id IS NOT NULL) as roles
      FROM public.users u
      INNER JOIN public.user_tenant ut ON u.id = ut.user_id
      INNER JOIN public.tenants t ON ut.tenant_id = t.id
      LEFT JOIN public.users_roles_roles urr ON u.id = urr."user_id"
      LEFT JOIN public.roles r ON urr."role_id" = r.id
      WHERE u.id = $1
      GROUP BY u.id, t.id, t.slug, t.company_name
    `;

    const users = await this.dataSource.query(query, [id]);

    if (!users || users.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = users[0];

    return {
      ...user,
      tenant: {
        id: user.tenant_id,
        slug: user.tenant_slug,
        company_name: user.tenant_company_name,
      },
      roles: user.roles || [],
    };
  }

  async updateUserRoles(
    userId: string,
    updateRolesDto: UpdateUserRolesDto,
  ): Promise<any> {
    // Get role IDs from public schema
    const roles = await this.dataSource.query(
      `SELECT id FROM public.roles WHERE name = ANY($1)`,
      [updateRolesDto.roles],
    );

    if (roles.length !== updateRolesDto.roles.length) {
      throw new NotFoundException('One or more roles not found');
    }

    // Delete existing role associations
    await this.dataSource.query(
      `DELETE FROM public.users_roles_roles WHERE "user_id" = $1`,
      [userId],
    );

    // Insert new role associations
    for (const role of roles) {
      await this.dataSource.query(
        `INSERT INTO public.users_roles_roles ("user_id", "role_id") VALUES ($1, $2)`,
        [userId, role.id],
      );
    }

    return this.getUserById(userId);
  }

  async updateUserStatus(
    userId: string,
    statusDto: UpdateUserStatusDto,
  ): Promise<any> {
    const userWithTenant = await this.getUserById(userId);
    // Note: This returns the user with status info added
    // You may need to add an is_active column to the users table if you want to persist this
    return {
      ...userWithTenant,
      is_active: statusDto.is_active,
      status_reason: statusDto.reason,
      status_updated_at: new Date(),
    };
  }

  async validateTenant(tenantId: string): Promise<any> {
    // Find the tenant directly
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if tenant is in pending status
    if (tenant.status !== 'pending') {
      return {
        message: `Tenant is already ${tenant.status}`,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          company_name: tenant.company_name,
          status: tenant.status,
        },
      };
    }

    // Update tenant status to approved
    await this.tenantRepository.update(tenant.id, { status: 'approved' });

    // Fetch updated tenant
    const updatedTenant = await this.tenantRepository.findOne({
      where: { id: tenant.id },
    });

    return {
      message: 'Tenant validated and approved successfully',
      tenant: {
        id: updatedTenant.id,
        slug: updatedTenant.slug,
        company_name: updatedTenant.company_name,
        status: updatedTenant.status,
      },
    };
  }

  async rejectTenant(tenantId: string, reason?: string): Promise<any> {
    // Find the tenant directly
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if tenant is in pending status
    if (tenant.status !== 'pending') {
      return {
        message: `Tenant is already ${tenant.status}`,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          company_name: tenant.company_name,
          status: tenant.status,
        },
      };
    }

    // Update tenant status to rejected
    await this.tenantRepository.update(tenant.id, { status: 'rejected' });

    // Fetch updated tenant
    const updatedTenant = await this.tenantRepository.findOne({
      where: { id: tenant.id },
    });

    return {
      message: 'Tenant rejected successfully',
      reason: reason || 'No reason provided',
      tenant: {
        id: updatedTenant.id,
        slug: updatedTenant.slug,
        company_name: updatedTenant.company_name,
        status: updatedTenant.status,
      },
    };
  }

  async deleteUser(userId: string): Promise<any> {
    // Check if user exists
    await this.getUserById(userId);

    // Delete from UserTenant mapping
    await this.userTenantRepository.delete({ user_id: userId });

    // Delete user roles
    await this.dataSource.query(
      `DELETE FROM public.users_roles_roles WHERE "user_id" = $1`,
      [userId],
    );

    // Delete user from public schema
    await this.dataSource.query(`DELETE FROM public.users WHERE id = $1`, [
      userId,
    ]);

    return { message: 'User deleted successfully', id: userId };
  }

  async getPendingInvitations(
    page: number = 1,
    limit: number = 10,
  ): Promise<Pagination<Invitation>> {
    return paginate<Invitation>(
      this.invitationRepository,
      { page, limit },
      {
        where: { status: InvitationStatus.PENDING },
        relations: ['tenant'],
        order: { created_at: 'DESC' },
      },
    );
  }

  async acceptInvitation(invitationId: string): Promise<any> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return {
      message: 'Invitation accepted successfully',
      invitation,
    };
  }

  async rejectInvitation(invitationId: string): Promise<any> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.REVOKED;
    await this.invitationRepository.save(invitation);

    return {
      message: 'Invitation rejected successfully',
      invitation,
    };
  }

  async getTenantUsers(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const offset = (page - 1) * limit;

    const query = `
      SELECT u.*, 
             json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name, 'description', r.description)) FILTER (WHERE r.id IS NOT NULL) as roles
      FROM public.users u
      INNER JOIN public.user_tenant ut ON u.id = ut.user_id
      LEFT JOIN public.users_roles_roles urr ON u.id = urr."user_id"
      LEFT JOIN public.roles r ON urr."role_id" = r.id
      WHERE ut.tenant_id = $1
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM public.users u
      INNER JOIN public.user_tenant ut ON u.id = ut.user_id
      WHERE ut.tenant_id = $1
    `;

    const users = await this.dataSource.query(query, [tenantId, limit, offset]);
    const countResult = await this.dataSource.query(countQuery, [tenantId]);
    const totalItems = parseInt(countResult[0].total);

    return {
      items: users.map((u: any) => ({
        ...u,
        roles: u.roles || [],
      })),
      meta: {
        totalItems,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        company_name: tenant.company_name,
      },
    };
  }
}
