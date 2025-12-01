import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Creative } from '../entities/creative.entity';
import { CreateCreativeDto, UpdateCreativeDto } from '../dto';
import { FilterCreativeDto } from '../dto/filter-creative.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';
import { TemplateService } from '@app/modules/template/services/template.service';
import { AuthenticatedUser } from '@app/modules/auth/decorators';

@Injectable()
export class CreativeService {
  constructor(
    private readonly tenantConnection: TenantConnectionService,
    private readonly templateService: TemplateService,
  ) {}

  async create(
    createCreativeDto: CreateCreativeDto,
    owner_id: string,
    organization_id: string,
    user: AuthenticatedUser,
  ): Promise<Creative> {
    const creativeRepository =
      await this.tenantConnection.getRepository(Creative);

    // Extract id_template from DTO as it's not a persisted field
    const { id_template, ...creativeData } = createCreativeDto;

    const creative = creativeRepository.create({
      ...creativeData,
      organization_id,
      owner_id,
    });

    if (id_template) {
      const template = await this.templateService.findOne(id_template);

      if (!template) {
        throw new NotFoundException(
          `Template with ID ${id_template} not found`,
        );
      }
      console.log('Before Template Video Creation');
      const templateVideo = await this.templateService.generateTemplateVideo(
        id_template,
        user,
      );

      const baseUrl = process.env.APP_URL || 'https://airspot-backend.dba.ma';
      const publicUrl = `${baseUrl}/api/v1/video-download/public/file/${encodeURIComponent(templateVideo.videoPath)}`;

      console.log(
        'Template Video Created  Successfully, Video Path: ',
        publicUrl,
      );
      creative.video_path = publicUrl;
    }

    return await creativeRepository.save(creative);
  }

  async findAll(filterDto: FilterCreativeDto): Promise<Pagination<Creative>> {
    const creativeRepository =
      await this.tenantConnection.getRepository(Creative);

    const where: FindOptionsWhere<Creative> = {};

    if (filterDto?.name) {
      where.name = Like(`%${filterDto.name}%`);
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
