/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { Campaign } from '../entities/campaign.entity';
import { Audience } from '../../audience/entities/audience.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { FilterCampaignDto } from '../dto/filter-campaign.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, Like } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ALLOWED_GOALS, levenshtein } from '../helper/goalAdapter';
import { TaskService } from '@app/modules/task/services/task.service';
import { TaskStatus, Priority } from '@app/modules/task/entities/task.entity';

@Injectable()
export class CampaignService {
  constructor(
    private readonly tenantConnection: TenantConnectionService,
    private readonly taskService: TaskService,
  ) {}

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

    // Link audiences to the campaign if audienceIds are provided
    if (
      createCampaignDto.audienceIds &&
      createCampaignDto.audienceIds.length > 0
    ) {
      const audienceRepository =
        await this.tenantConnection.getRepository(Audience);
      const audiences = await audienceRepository
        .createQueryBuilder('audience')
        .where('audience.id IN (:...ids)', {
          ids: createCampaignDto.audienceIds,
        })
        .getMany();

      if (audiences.length > 0) {
        campaign.audiences = audiences;
      }
    }

    const savedCampaign = await campaignRepository.save(campaign);

    // Automatically create default tasks for the new campaign
    await this.createDefaultTasksForCampaign(savedCampaign, organization_id);

    return savedCampaign;
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

    // Update audiences if audienceIds are provided
    if (updateCampaignDto.audienceIds !== undefined) {
      const audienceRepository =
        await this.tenantConnection.getRepository(Audience);
      if (updateCampaignDto.audienceIds.length > 0) {
        const audiences = await audienceRepository
          .createQueryBuilder('audience')
          .where('audience.id IN (:...ids)', {
            ids: updateCampaignDto.audienceIds,
          })
          .getMany();
        campaign.audiences = audiences;
      } else {
        campaign.audiences = null;
      }
      await campaignRepository.save(campaign);
    }

    if (Object.keys(updateData).length > 0) {
      await campaignRepository.update(campaign.id, updateData);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findOne(id);
    const campaignRepository =
      await this.tenantConnection.getRepository(Campaign);
    await campaignRepository.remove(campaign);
  }

  /**
   * Create default tasks for a newly created campaign
   * These tasks guide the user through the campaign workflow
   */
  private async createDefaultTasksForCampaign(
    campaign: Campaign,
    organization_id: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Calculate task due dates starting from today with progressive intervals
    const task1DueDate = new Date(today);
    task1DueDate.setDate(task1DueDate.getDate() + 2); // 2 days from today

    const task2DueDate = new Date(today);
    task2DueDate.setDate(task2DueDate.getDate() + 5); // 5 days from today

    const task3DueDate = new Date(today);
    task3DueDate.setDate(task3DueDate.getDate() + 8); // 8 days from today

    const task4DueDate = new Date(today);
    task4DueDate.setDate(task4DueDate.getDate() + 15); // 15 days from today

    const task5DueDate = new Date(today);
    task5DueDate.setDate(task5DueDate.getDate() + 30); // 30 days from today

    const defaultTasks = [
      {
        name: 'Define Campaign Strategy & Objectives',
        description: `Finalize the campaign strategy for "${campaign.name}". Review target audience, key messages, and success metrics. Ensure alignment with the ${campaign.goal} goal.`,
        related_campaign_id: campaign.id,
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        due_date: task1DueDate.toISOString(),
      },
      {
        name: 'Create & Review Creative Assets',
        description: `Design and prepare all creative materials for "${campaign.name}". This includes ad copy, visuals, videos, and any other campaign assets. Ensure they align with brand guidelines.`,
        related_campaign_id: campaign.id,
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        due_date: task2DueDate.toISOString(),
      },
      {
        name: 'Set Up Campaign Tracking & Analytics',
        description: `Configure tracking pixels, UTM parameters, and analytics tools for "${campaign.name}". Verify that all conversion tracking is properly implemented before launch.`,
        related_campaign_id: campaign.id,
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        due_date: task3DueDate.toISOString(),
      },
      {
        name: 'Monitor Campaign Performance & Optimize',
        description: `Review performance metrics for "${campaign.name}" at mid-campaign. Analyze impressions, reach, engagement, and conversions. Make data-driven optimizations to improve results.`,
        related_campaign_id: campaign.id,
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        due_date: task4DueDate.toISOString(),
      },
      {
        name: 'Generate Campaign Report & Insights',
        description: `Complete the post-campaign analysis for "${campaign.name}". Document key learnings, ROI, and recommendations for future campaigns. Share findings with stakeholders.`,
        related_campaign_id: campaign.id,
        status: TaskStatus.TODO,
        priority: Priority.LOW,
        due_date: task5DueDate.toISOString(),
      },
    ];

    // Create all tasks
    for (const taskData of defaultTasks) {
      try {
        await this.taskService.create(taskData, organization_id);
      } catch (error) {
        // Log error but don't fail campaign creation if task creation fails
        console.error(
          `Failed to create task "${taskData.name}" for campaign ${campaign.id}:`,
          error,
        );
      }
    }
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
      {
        re: /(app[\s_-]?revenue|apprevenue|app|application)/i,
        goal: 'APP_REVENUE',
      },
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
