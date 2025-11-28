/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

    // Map new DTO structure to entity structure
    const campaign = campaignRepository.create({
      name: createCampaignDto.name,
      goal: createCampaignDto.selectedGoal as any, // Map to CampaignGoal enum
      budget_type: 'LIFETIME' as any, // Default or derive from budgetAmount
      budget_amount: parseFloat(createCampaignDto.budgetAmount) || 0,
      start_date: new Date(createCampaignDto.startDate),
      end_date: new Date(createCampaignDto.endDate),
      status: createCampaignDto.status as any, // Map to CampaignStatus enum
      organization_id,
      owner_id,
      // Store additional data as JSON in a metadata field if needed
      // For now, we'll map the basic fields
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
    if (updateCampaignDto.selectedGoal) {
      updateData.goal = updateCampaignDto.selectedGoal as any;
    }
    if (updateCampaignDto.status) {
      updateData.status = updateCampaignDto.status;
    }
    if (updateCampaignDto.budgetAmount) {
      updateData.budget_amount =
        parseFloat(updateCampaignDto.budgetAmount) || 0;
    }
    if (updateCampaignDto.startDate) {
      updateData.start_date = new Date(updateCampaignDto.startDate);
    }
    if (updateCampaignDto.endDate) {
      updateData.end_date = new Date(updateCampaignDto.endDate);
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
