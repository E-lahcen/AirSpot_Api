import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { UserTenant } from '../entities/user-tenant.entity';
import { CreateUserTenantDto } from '../dtos/create-user-tenant.dto';
import { UpdateUserTenantDto } from '../dtos/update-user-tenant.dto';
import { FilterUserTenantDto } from '../dtos/filter-user-tenant.dto';

@Injectable()
export class UserTenantService {
  constructor(
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
  ) {}

  async create(createUserTenantDto: CreateUserTenantDto): Promise<UserTenant> {
    const userTenant = this.userTenantRepository.create(createUserTenantDto);
    return await this.userTenantRepository.save(userTenant);
  }

  async findAll(
    filterDto: FilterUserTenantDto,
  ): Promise<Pagination<UserTenant>> {
    const where: FindOptionsWhere<UserTenant> = {};

    if (filterDto?.user_id) {
      where.user_id = filterDto.user_id;
    }

    if (filterDto?.tenant_id) {
      where.tenant_id = filterDto.tenant_id;
    }

    if (filterDto?.email) {
      where.email = filterDto.email;
    }

    return paginate<UserTenant>(
      this.userTenantRepository,
      {
        page: filterDto.page || 1,
        limit: filterDto.limit || 10,
      },
      {
        where,
        relations: ['tenant'],
      },
    );
  }

  async findOne(id: string): Promise<UserTenant> {
    const userTenant = await this.userTenantRepository.findOne({
      where: { id },
    });

    if (!userTenant) {
      throw new NotFoundException(`UserTenant with ID ${id} not found`);
    }

    return userTenant;
  }

  async update(
    id: string,
    updateUserTenantDto: UpdateUserTenantDto,
  ): Promise<UserTenant> {
    const userTenant = await this.findOne(id);

    const updateData: Partial<UserTenant> = {};

    if (updateUserTenantDto.user_id) {
      updateData.user_id = updateUserTenantDto.user_id;
    }
    if (updateUserTenantDto.tenant_id) {
      updateData.tenant_id = updateUserTenantDto.tenant_id;
    }

    return this.userTenantRepository
      .update(userTenant.id, updateData)
      .then(() => this.findOne(id));
  }

  async remove(id: string): Promise<void> {
    const userTenant = await this.findOne(id);
    await this.userTenantRepository.remove(userTenant);
  }

  async findByUserId(userId: string): Promise<UserTenant[]> {
    return this.userTenantRepository.find({
      where: { user_id: userId },
    });
  }

  async findByTenantId(tenantId: string): Promise<UserTenant[]> {
    return this.userTenantRepository.find({
      where: { tenant_id: tenantId },
    });
  }
}
