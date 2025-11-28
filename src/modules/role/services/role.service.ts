import { Injectable } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async findByName(name: string): Promise<Role | null> {
    const roleRepo = await this.tenantConnection.getRepository(Role);
    return roleRepo.findOne({ where: { name } });
  }

  async findById(id: string): Promise<Role | null> {
    const roleRepo = await this.tenantConnection.getRepository(Role);
    return roleRepo.findOne({ where: { id } });
  }

  async getAllRoles(): Promise<Role[]> {
    const roleRepo = await this.tenantConnection.getRepository(Role);
    return roleRepo.find({ order: { name: 'ASC' } });
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const manager = await this.tenantConnection.getEntityManager();
    const role = manager.create(Role, { name, description });
    return manager.save(Role, role);
  }

  async ensureDefaultRoles(): Promise<void> {
    const ownerRole = await this.findByName('owner');
    if (!ownerRole) {
      await this.createRole(
        'owner',
        'Company owner with full administrative access',
      );
    }

    const adminRole = await this.findByName('admin');
    if (!adminRole) {
      await this.createRole('admin', 'Administrator with full access');
    }

    const memberRole = await this.findByName('member');
    if (!memberRole) {
      await this.createRole('member', 'Regular member with limited access');
    }
  }
}
