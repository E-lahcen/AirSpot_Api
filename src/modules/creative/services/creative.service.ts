import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Creative } from '../entities/creative.entity';
import { CreateCreativeDto, UpdateCreativeDto } from '../dto';
import { FilterCreativeDto } from '../dto/filter-creative.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';

@Injectable()
export class CreativeService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createCreativeDto: CreateCreativeDto,
    owner_id: string,
    organization_id: string,
  ): Promise<Creative> {
    const creativeRepository =
      await this.tenantConnection.getRepository(Creative);

    const creative = creativeRepository.create({
      ...createCreativeDto,
      organization_id,
      owner_id,
    });

    return await creativeRepository.save(creative);
  }

  async findAll(filterDto: FilterCreativeDto): Promise<Pagination<Creative>> {
    const creativeRepository =
      await this.tenantConnection.getRepository(Creative);

    const where: FindOptionsWhere<Creative> = {};

    if (filterDto?.name) {
      where.name = Like(`%${filterDto.name}%`);
    }
    if (filterDto?.mime_type) {
      where.mime_type = Like(`%${filterDto.mime_type}%`);
    }
    if (filterDto?.owner_id) {
      where.owner_id = filterDto.owner_id;
    }

    const queryBuilder = creativeRepository
      .createQueryBuilder('creative')
      .orderBy('creative.created_at', 'DESC');

    if (Object.keys(where).length > 0) {
      queryBuilder.where(where);
    }

    return paginate<Creative>(queryBuilder, {
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
    });
  }

  async findOne(id: string): Promise<Creative> {
    const creativeRepository =
      await this.tenantConnection.getRepository(Creative);
    const creative = await creativeRepository.findOne({
      where: { id },
      relations: ['ad_variations'],
    });

    if (!creative) {
      throw new NotFoundException(`Creative with ID ${id} not found`);
    }

    return creative;
  }

  async update(
    id: string,
    updateCreativeDto: UpdateCreativeDto,
  ): Promise<Creative> {
    const creative = await this.findOne(id);
    const creativeRepository =
      await this.tenantConnection.getRepository(Creative);

    Object.assign(creative, updateCreativeDto);

    return await creativeRepository.save(creative);
  }

  async remove(id: string): Promise<void> {
    const creative = await this.findOne(id);
    const creativeRepository =
      await this.tenantConnection.getRepository(Creative);
    await creativeRepository.remove(creative);
  }
}
