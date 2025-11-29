import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Campaign } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { FilterCampaignDto } from '../dto/filter-campaign.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';

@Injectable()
export class CampaignService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    owner_id: string,
    organization_id: string,
  ): Promise<Campaign> {
    const campaignRepository =
      await this.tenantConnection.getRepository(Campaign);

    const campaign = campaignRepository.create({
      ...createCampaignDto,
      organization_id,
      owner_id,
      start_date: new Date(createCampaignDto.start_date),
      end_date: new Date(createCampaignDto.end_date),
    });

    return await campaignRepository.save(campaign);
  }

  async findAll(filterDto: FilterCampaignDto): Promise<Pagination<Campaign>> {
    const campaignRepository =
      await this.tenantConnection.getRepository(Campaign);

    const where: FindOptionsWhere<Campaign> = {};

    if (filterDto?.name) {
      where.name = Like(`%${filterDto.name}%`);
    }
    if (filterDto?.goal) {
      where.goal = filterDto.goal;
    }
    if (filterDto?.status) {
      where.status = filterDto.status;
    }
    if (filterDto?.budget_type) {
      where.budget_type = filterDto.budget_type;
    }
    if (filterDto?.owner_id) {
      where.owner_id = filterDto.owner_id;
    }

    const queryBuilder = campaignRepository
      .createQueryBuilder('campaign')
      .orderBy('campaign.created_at', 'DESC');

    if (Object.keys(where).length > 0) {
      queryBuilder.where(where);
    }

    return paginate<Campaign>(queryBuilder, {
      page: filterDto.page || 1,
      limit: filterDto.limit || 10,
    });
  }

  async findOne(id: string): Promise<Campaign> {
    const campaignRepository =
      await this.tenantConnection.getRepository(Campaign);
    const campaign = await campaignRepository.findOne({
      where: { id },
      relations: ['ad_variations'],
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id);
    const campaignRepository =
      await this.tenantConnection.getRepository(Campaign);

    const updateData: Partial<Campaign> = {};

    if (updateCampaignDto.name) {
      updateData.name = updateCampaignDto.name;
    }
    if (updateCampaignDto.goal) {
      updateData.goal = updateCampaignDto.goal;
    }
    if (updateCampaignDto.budget_type) {
      updateData.budget_type = updateCampaignDto.budget_type;
    }
    if (updateCampaignDto.budget_amount) {
      updateData.budget_amount = updateCampaignDto.budget_amount;
    }
    if (updateCampaignDto.status) {
      updateData.status = updateCampaignDto.status;
    }
    if (updateCampaignDto.start_date) {
      updateData.start_date = new Date(updateCampaignDto.start_date);
    }
    if (updateCampaignDto.end_date) {
      updateData.end_date = new Date(updateCampaignDto.end_date);
    }
    if (updateCampaignDto.published_at) {
      updateData.published_at = updateCampaignDto.published_at
        ? new Date(updateCampaignDto.published_at)
        : null;
    }

    return campaignRepository
      .update(campaign.id, updateData)
      .then(() => this.findOne(id));
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findOne(id);
    const campaignRepository =
      await this.tenantConnection.getRepository(Campaign);
    await campaignRepository.remove(campaign);
  }
}
