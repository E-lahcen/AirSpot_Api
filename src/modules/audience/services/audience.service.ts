import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Audience, TargetType } from '../entities/audience.entity';
import { CreateAudienceDto, UpdateAudienceDto } from '../dto';
import { FilterAudienceDto } from '../dto/filter-audience.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class AudienceService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createAudienceDto: CreateAudienceDto,
    owner_id: string,
    organization_id: string,
  ): Promise<any> {
    const audienceRepository =
      await this.tenantConnection.getRepository(Audience);

    const audience = audienceRepository.create({
      type: createAudienceDto.category as TargetType,
      name: createAudienceDto.name,
      size: createAudienceDto.size,
      reached: createAudienceDto.reached,
      platforms: createAudienceDto.platforms,
      campaigns: createAudienceDto.campaigns,
      selected_locations: createAudienceDto.selected_locations,
      selected_interests: createAudienceDto.selected_interests,
      age_range: createAudienceDto.age_range,
      selected_genders: createAudienceDto.selected_genders,
      owner_id,
      organization_id,
    });
    console.log('audience', audience);
    return await audienceRepository.save(audience);
  }

  async findAll(filterDto: FilterAudienceDto): Promise<Pagination<Audience>> {
    const audienceRepository =
      await this.tenantConnection.getRepository(Audience);

    const where: FindOptionsWhere<Audience> = {};

    if (filterDto?.variation_id) {
      where.variation_id = filterDto.variation_id;
    }
    if (filterDto?.type) {
      where.type = filterDto.type;
    }
    if (filterDto?.target_id) {
      where.target_id = filterDto.target_id;
    }
    if (filterDto?.owner_id) {
      where.owner_id = filterDto.owner_id;
    }

    const queryBuilder = audienceRepository
      .createQueryBuilder('audience')
      .leftJoinAndSelect('audience.ad_variation', 'ad_variation')
      .orderBy('audience.created_at', 'DESC');

    if (Object.keys(where).length > 0) {
      queryBuilder.where(where);
    }

    return paginate<Audience>(queryBuilder, {
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
    });
  }

  async findByVariation(variation_id: string): Promise<Audience[]> {
    const audienceRepository =
      await this.tenantConnection.getRepository(Audience);
    return audienceRepository.find({
      where: { variation_id },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Audience> {
    const audienceRepository =
      await this.tenantConnection.getRepository(Audience);
    const audience = await audienceRepository.findOne({
      where: { id },
      relations: ['ad_variation'],
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    return audience;
  }

  async update(
    id: string,
    updateAudienceDto: UpdateAudienceDto,
  ): Promise<Audience> {
    const audience = await this.findOne(id);
    const audienceRepository =
      await this.tenantConnection.getRepository(Audience);

    Object.assign(audience, updateAudienceDto);

    return await audienceRepository.save(audience);
  }

  async remove(id: string): Promise<void> {
    const audience = await this.findOne(id);
    const audienceRepository =
      await this.tenantConnection.getRepository(Audience);
    await audienceRepository.remove(audience);
  }
}
