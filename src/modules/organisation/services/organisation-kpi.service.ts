import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Tenant } from '@app/modules/tenant/entities/tenant.entity';
import { Brand } from '@app/modules/brand/entities/brand.entity';
import { CampaignKpiService } from '@app/modules/campaign/services/campaign-kpi.service';
import { CreativeKpiService } from '@app/modules/creative/services/creative-kpi.service';
import { AudienceKpiService } from '@app/modules/audience/services/audience-kpi.service';
import { AdVariationKpiService } from '@app/modules/ad-variation/services/ad-variation-kpi.service';
import {
  OrganisationKpiDto,
  OrganisationKpiSummaryDto,
  MultipleOrganisationsKpiDto,
  BrandInfoDto,
  CampaignSummaryDto,
  CreativeSummaryDto,
} from '../dto/organisation-kpi.dto';

@Injectable()
export class OrganisationKpiService {
  private publicDataSource: DataSource;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly campaignKpiService: CampaignKpiService,
    private readonly creativeKpiService: CreativeKpiService,
    private readonly audienceKpiService: AudienceKpiService,
    private readonly adVariationKpiService: AdVariationKpiService,
  ) {
    this.publicDataSource = dataSource;
  }

  /**
   * Get KPI for a specific organization by tenant/schema
   */
  async getOrganisationKpi(tenantId: string): Promise<OrganisationKpiDto> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Organization with id ${tenantId} not found`);
    }

    // Get a connection scoped to the tenant's schema
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      const schemaName = tenant.schema_name;

      // Set search path to tenant schema
      await queryRunner.query(`SET search_path TO "${schemaName}", public`);

      const manager = queryRunner.manager;

      // Get all KPI data using individual module services
      const campaignKpi = await this.campaignKpiService.getCampaignKpi(manager);
      const creativeKpi = await this.creativeKpiService.getCreativeKpi(manager);
      const audienceKpi = await this.audienceKpiService.getAudienceKpi(manager);
      const adVariationKpi =
        await this.adVariationKpiService.getAdVariationKpi(manager);

      // Get owner information from the tenant's schema
      let ownerName: string | null = null;
      try {
        const User = manager.getRepository('users');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const owner = await (User as any).findOne({
          where: { email: tenant.owner_email },
        });
        if (owner) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ownerName =
            owner.full_name || (owner.first_name && owner.last_name)
              ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                `${owner.first_name} ${owner.last_name}`.trim()
              : null;
        }
      } catch (error) {
        // Owner info is optional, continue without it
        console.warn('Could not fetch owner info:', error);
      }

      // Get related brands (from public schema)
      const brands = await this.brandRepository.find({
        where: { tenant_id: tenantId },
        order: { created_at: 'DESC' },
      });

      const relatedBrands: BrandInfoDto[] = brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        logo: brand.logo || null,
        description: brand.description || null,
        created_at: brand.created_at,
      }));

      // Get related campaigns
      const Campaign = manager.getRepository('Campaign');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const campaigns = (await Campaign.find({
        order: { created_at: 'DESC' },
        take: 10, // Limit to top 10
      })) as any;

      const relatedCampaigns: CampaignSummaryDto[] = (
        campaigns as Array<{
          id: string;
          name: string;
          status: string;
          budget_amount: number;
          spend: number;
          created_at: Date;
        }>
      ).map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status || 'DRAFT',
        budget: campaign.budget_amount || 0,
        spent: campaign.spend || 0,
        created_at: campaign.created_at,
      }));

      // Get related creatives
      const Creative = manager.getRepository('Creative');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const creatives = (await Creative.find({
        order: { created_at: 'DESC' },
        take: 10, // Limit to top 10
      })) as any;

      const relatedCreatives: CreativeSummaryDto[] = (
        creatives as Array<{
          id: string;
          name: string;
          mime_type: string;
          brand_id: string;
        }>
      ).map((creative) => ({
        id: creative.id,
        name: creative.name,
        type: creative.mime_type?.startsWith('video') ? 'video' : 'image',
        brand_id: creative.brand_id || null,
      }));

      return {
        organization_id: tenant.id,
        organization_name: tenant.company_name,
        owner_email: tenant.owner_email,
        owner_name: ownerName,
        created_at: tenant.created_at,
        campaigns: campaignKpi,
        creatives: creativeKpi,
        audiences: audienceKpi,
        ad_variations: adVariationKpi,
        related_brands: relatedBrands,
        related_campaigns: relatedCampaigns,
        related_creatives: relatedCreatives,
        calculated_at: new Date(),
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get KPI summary for a specific organization
   */
  async getOrganisationKpiSummary(
    tenantId: string,
    userRole?: string,
  ): Promise<OrganisationKpiSummaryDto> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Organization with id ${tenantId} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      const schemaName = tenant.schema_name;

      await queryRunner.query(`SET search_path TO "${schemaName}", public`);
      const manager = queryRunner.manager;

      // Get summary statistics from module services
      const campaignKpi = await this.campaignKpiService.getCampaignKpi(manager);
      const creativeKpi = await this.creativeKpiService.getCreativeKpi(manager);
      const audienceKpi = await this.audienceKpiService.getAudienceKpi(manager);

      return {
        organization_id: tenant.id,
        organization_name: tenant.company_name,
        total_campaigns: campaignKpi.total_campaigns,
        active_campaigns: campaignKpi.active_campaigns,
        total_creatives: creativeKpi.total_creatives,
        total_audiences: audienceKpi.total_audiences,
        total_budget: campaignKpi.total_budget,
        total_spent: campaignKpi.total_spent,
        user_role: userRole,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get KPI for multiple organizations
   */
  async getMultipleOrganisationsKpi(
    tenantIds: string[],
    userRole?: string,
  ): Promise<MultipleOrganisationsKpiDto> {
    const organizationSummaries: OrganisationKpiSummaryDto[] = [];
    let combinedTotalCampaigns = 0;
    let combinedTotalCreatives = 0;
    let combinedTotalAudiences = 0;
    let combinedTotalBudget = 0;

    // Get summaries for each organization
    for (const tenantId of tenantIds) {
      try {
        const summary = await this.getOrganisationKpiSummary(
          tenantId,
          userRole,
        );
        organizationSummaries.push(summary);

        combinedTotalCampaigns += summary.total_campaigns;
        combinedTotalCreatives += summary.total_creatives;
        combinedTotalAudiences += summary.total_audiences;
        combinedTotalBudget += summary.total_budget;
      } catch (error) {
        // Skip organizations that can't be accessed
        console.warn(`Could not access organization ${tenantId}:`, error);
      }
    }

    return {
      organizations: organizationSummaries,
      total_organizations: organizationSummaries.length,
      combined_stats: {
        total_campaigns: combinedTotalCampaigns,
        total_creatives: combinedTotalCreatives,
        total_audiences: combinedTotalAudiences,
        total_budget: combinedTotalBudget,
      },
    };
  }

  /**
   * Helper: Get tenant by ID
   */
  private async getTenantById(tenantId: string): Promise<Tenant | null> {
    const tenantRepository = this.publicDataSource.getRepository(Tenant);
    return tenantRepository.findOne({
      where: { id: tenantId },
    });
  }
}
