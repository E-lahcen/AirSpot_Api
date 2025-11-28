import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { AdVariation } from '../entities/ad-variation.entity';
import { CreateAdVariationDto, UpdateAdVariationDto } from '../dto';
import { FilterAdVariationDto } from '../dto/filter-ad-variation.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';

@Injectable()
export class AdVariationService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createAdVariationDto: CreateAdVariationDto,
    owner_id: string,
    organization_id: string,
  ): Promise<AdVariation> {
    const adVariationRepository =
      await this.tenantConnection.getRepository(AdVariation);

    const adVariation = adVariationRepository.create({
      ...createAdVariationDto,
      organization_id,
      owner_id,
    });

    return await adVariationRepository.save(adVariation);
  }

  async findAll(
    filterDto: FilterAdVariationDto,
  ): Promise<Pagination<AdVariation>> {
    const adVariationRepository =
      await this.tenantConnection.getRepository(AdVariation);

    const where: FindOptionsWhere<AdVariation> = {};

    if (filterDto?.name) {
      where.name = Like(`%${filterDto.name}%`);
    }
    if (filterDto?.campaign_id) {
      where.campaign_id = filterDto.campaign_id;
    }
    if (filterDto?.bidding_strategy) {
      where.bidding_strategy = filterDto.bidding_strategy;
    }
    if (filterDto?.owner_id) {
      where.owner_id = filterDto.owner_id;
    }

    const queryBuilder = adVariationRepository
      .createQueryBuilder('ad_variation')
      .leftJoinAndSelect('ad_variation.campaign', 'campaign')
      .leftJoinAndSelect('ad_variation.creative', 'creative')
      .leftJoinAndSelect('ad_variation.audiences', 'audiences')
      .orderBy('ad_variation.created_at', 'DESC');

    if (Object.keys(where).length > 0) {
      queryBuilder.where(where);
    }

    return paginate<AdVariation>(queryBuilder, {
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
    });
  }

  async findByCampaign(campaign_id: string): Promise<AdVariation[]> {
    const adVariationRepository =
      await this.tenantConnection.getRepository(AdVariation);
    return await adVariationRepository.find({
      where: { campaign_id },
      relations: ['creative', 'audiences'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AdVariation> {
    const adVariationRepository =
      await this.tenantConnection.getRepository(AdVariation);
    const adVariation = await adVariationRepository.findOne({
      where: { id },
      relations: ['campaign', 'creative', 'audiences'],
    });

    if (!adVariation) {
      throw new NotFoundException(`Ad Variation with ID ${id} not found`);
    }

    return adVariation;
  }

  async update(
    id: string,
    updateAdVariationDto: UpdateAdVariationDto,
  ): Promise<AdVariation> {
    const adVariation = await this.findOne(id);
    const adVariationRepository =
      await this.tenantConnection.getRepository(AdVariation);

    Object.assign(adVariation, updateAdVariationDto);

    return await adVariationRepository.save(adVariation);
  }

  async remove(id: string): Promise<void> {
    const adVariation = await this.findOne(id);
    const adVariationRepository =
      await this.tenantConnection.getRepository(AdVariation);
    await adVariationRepository.remove(adVariation);
  }
}
