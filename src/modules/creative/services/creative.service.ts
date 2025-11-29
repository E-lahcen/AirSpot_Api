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

  private adaptFrontendToDto(payload: any, owner_id?: string, organization_id?: string) {
    const dto: any = {
      // core fields
      name: payload.name,
      description: payload.description ?? null,
      orientation: payload.orientation,
      theme: payload.theme,
      video_position: payload.video_position,
      brand_name: payload.brand_name,
      product_name: payload.product_name,

      // paths / filenames
      logo_path: payload.logo_path,
      product_image_path: payload.product_image_path,
      video_path: payload.video_path,
      template_image_path: payload.template_image_path,
      filename: payload.filename,

      // booleans / misc
      show_qr_code: typeof payload.show_qr_code === 'boolean' ? payload.show_qr_code : (payload.show_qr_code === 'true'),
      qr_code_text: payload.qr_code_text,

      // numeric conversion if needed
      price: payload.price !== undefined && payload.price !== null ? (isNaN(Number(payload.price)) ? payload.price : Number(payload.price)) : undefined,

      // arrays
      features: Array.isArray(payload.features) ? payload.features : (payload.features ? [payload.features] : []),

      // ids: prefer explicit args, fall back to payload
      owner_id: owner_id ?? payload.owner_id,
      organization_id: organization_id ?? payload.organization_id,
    };

    // remove undefined keys so TypeORM/DTO validation isn't confused
    Object.keys(dto).forEach((k) => dto[k] === undefined && delete dto[k]);
    return dto as CreateCreativeDto;
  }

  async create(
    createCreativeDto: any,
    owner_id: string,
    organization_id: string,
  ): Promise<Creative> {
    const creativeRepository = await this.tenantConnection.getRepository(Creative);

    // normalize frontend payload to DTO shape
    const normalizedDto = this.adaptFrontendToDto(createCreativeDto, owner_id, organization_id);

    const creative = creativeRepository.create(normalizedDto);

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
