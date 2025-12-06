/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Campaign } from '../entities/campaign.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { FilterCampaignDto } from '../dto/filter-campaign.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ALLOWED_GOALS, levenshtein } from '../helper/goalAdapter';

@Injectable()
export class CampaignService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    owner_id: string,
    organization_id: string,
  ): Promise<Campaign> {
    // normalize the incoming selectedGoal robustly here to guarantee DB-safe enum
    createCampaignDto.selectedGoal = this.mapSelectedGoal(
      createCampaignDto.selectedGoal,
    );

    const campaignRepository =
      await this.tenantConnection.getRepository(Campaign);

    // Map CreateCampaignDto to Campaign entity
    const campaign = campaignRepository.create({
      name: createCampaignDto.name,
      goal: createCampaignDto.selectedGoal as any,
      budget_type: 'LIFETIME' as any,
      budget_amount: parseFloat(createCampaignDto.budgetAmount) || 0,
      start_date: new Date(createCampaignDto.startDate),
      end_date: new Date(createCampaignDto.endDate),
      status: createCampaignDto.status as any,
      organization_id,
      owner_id,
      // New fields from DTO
      selected_days: createCampaignDto.selectedDays,
      audience: createCampaignDto.audience,
      selected_broadcast_tv: createCampaignDto.selectedBroadcastTV,
      selected_streaming: createCampaignDto.selectedStreaming,
      bidding_strategy: createCampaignDto.biddingStrategy,
      creative_data: createCampaignDto.creativeData,
      // Metrics
      impressions: createCampaignDto.impressions || 0,
      reach: createCampaignDto.reach || 0,
      spend: createCampaignDto.spend || 0,
      roi: createCampaignDto.roi || null,
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
    // Update new fields
    if (updateCampaignDto.selectedDays) {
      updateData.selected_days = updateCampaignDto.selectedDays;
    }
    if (updateCampaignDto.audience) {
      updateData.audience = updateCampaignDto.audience;
    }
    if (updateCampaignDto.selectedBroadcastTV) {
      updateData.selected_broadcast_tv = updateCampaignDto.selectedBroadcastTV;
    }
    if (updateCampaignDto.selectedStreaming) {
      updateData.selected_streaming = updateCampaignDto.selectedStreaming;
    }
    if (updateCampaignDto.biddingStrategy) {
      updateData.bidding_strategy = updateCampaignDto.biddingStrategy;
    }
    if (updateCampaignDto.creativeData) {
      updateData.creative_data = updateCampaignDto.creativeData;
    }
    if (updateCampaignDto.impressions !== undefined) {
      updateData.impressions = updateCampaignDto.impressions;
    }
    if (updateCampaignDto.reach !== undefined) {
      updateData.reach = updateCampaignDto.reach;
    }
    if (updateCampaignDto.spend !== undefined) {
      updateData.spend = updateCampaignDto.spend;
    }
    if (updateCampaignDto.roi) {
      updateData.roi = updateCampaignDto.roi;
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

  private mapSelectedGoal(input?: string): string {
    if (!input) {
      throw new BadRequestException('selectedGoal is required');
    }

    // quick alias regexes for common misspellings / variants
    const aliases: Array<{ re: RegExp; goal: string }> = [
      { re: /(awareness|awarness|aware ?ness|awar?ness)/i, goal: 'AWARENESS' },
      { re: /(conversion|conversions|convert)/i, goal: 'CONVERSIONS' },
      { re: /(traffic|traffik)/i, goal: 'TRAFFIC' },
      { re: /(retarget|retargeting)/i, goal: 'RETARGET' },
      { re: /(app[\s_-]?revenue|apprevenue)/i, goal: 'APP_REVENUE' },
    ];

    for (const a of aliases) {
      if (a.re.test(input)) return a.goal;
    }

    // normalize and try exact enum match
    const candidate = input
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
    if (ALLOWED_GOALS.includes(candidate)) return candidate;

    // fuzzy fallback (small typos)
    let best = { goal: '', dist: Number.POSITIVE_INFINITY };
    for (const g of ALLOWED_GOALS) {
      const d = levenshtein(candidate, g);
      if (d < best.dist) best = { goal: g, dist: d };
    }

    const threshold = Math.max(1, Math.floor(best.goal.length * 0.25)); // allow small typos
    if (best.dist <= threshold) return best.goal;

    throw new BadRequestException(
      `Invalid selectedGoal '${input}'. Allowed values: ${ALLOWED_GOALS.join(
        ', ',
      )}`,
    );
  }
}
