import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { CreateBrandDto, UpdateBrandDto, FilterBrandDto } from '../dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    // Check if a brand with the same name exists for this tenant
    const existingBrand = await this.brandRepository.findOne({
      where: {
        name: createBrandDto.name,
        tenant_id: createBrandDto.tenant_id,
      },
    });

    if (existingBrand) {
      throw new ConflictException({
        message: 'Brand with this name already exists for this organization',
        errors: [
          {
            code: 'BRAND_EXISTS',
            message:
              'A brand with this name already exists in this organization',
          },
        ],
      });
    }

    const brand = this.brandRepository.create(createBrandDto);
    return await this.brandRepository.save(brand);
  }

  async findAll(
    filterDto?: FilterBrandDto,
  ): Promise<{ data: Brand[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      tenant_id,
      name,
      is_active,
    } = filterDto || {};

    interface WhereCondition {
      tenant_id?: string;
      name?: ReturnType<typeof Like>;
      is_active?: boolean;
    }

    const where: WhereCondition = {};

    if (tenant_id) {
      where.tenant_id = tenant_id;
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await this.brandRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['tenant'],
      order: {
        created_at: 'DESC',
      },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!brand) {
      throw new NotFoundException({
        message: 'Brand not found',
        errors: [
          {
            code: 'BRAND_NOT_FOUND',
            message: `Brand with ID ${id} does not exist`,
          },
        ],
      });
    }

    return brand;
  }

  async findByTenant(tenantId: string): Promise<Brand[]> {
    return await this.brandRepository.find({
      where: { tenant_id: tenantId },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);

    // If name is being updated, check for conflicts
    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existingBrand = await this.brandRepository.findOne({
        where: {
          name: updateBrandDto.name,
          tenant_id: brand.tenant_id,
        },
      });

      if (existingBrand && existingBrand.id !== id) {
        throw new ConflictException({
          message: 'Brand with this name already exists for this organization',
          errors: [
            {
              code: 'BRAND_EXISTS',
              message:
                'A brand with this name already exists in this organization',
            },
          ],
        });
      }
    }

    Object.assign(brand, updateBrandDto);
    return await this.brandRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify it exists
    await this.brandRepository.softDelete(id);
  }

  async restore(id: string): Promise<Brand> {
    await this.brandRepository.restore(id);
    return this.findOne(id);
  }
}
