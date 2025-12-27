import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Brand Info DTO
export class BrandInfoDto {
  @ApiProperty({
    description: 'Brand ID',
    example: 'brand-uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Brand name',
    example: 'Nike',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Brand logo URL',
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  logo?: string | null;

  @ApiPropertyOptional({
    description: 'Brand description',
    example: 'A leading sportswear brand',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Date when brand was created',
    example: '2025-01-15T10:30:00Z',
  })
  created_at: Date;
}

// Campaign Summary DTO
export class CampaignSummaryDto {
  @ApiProperty({
    description: 'Campaign ID',
    example: 'campaign-uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Campaign name',
    example: 'Summer Promotion 2025',
  })
  name: string;

  @ApiProperty({
    description: 'Campaign status',
    example: 'ACTIVE',
    enum: [
      'DRAFT',
      'ACTIVE',
      'PAUSED',
      'COMPLETED',
      'PENDING_VERIFICATION',
      'VERIFIED',
      'REJECTED',
    ],
  })
  status: string;

  @ApiProperty({
    description: 'Campaign budget',
    example: 5000,
  })
  budget: number;

  @ApiProperty({
    description: 'Campaign spending',
    example: 2500,
  })
  spent: number;

  @ApiProperty({
    description: 'Date when campaign was created',
    example: '2025-01-15T10:30:00Z',
  })
  created_at: Date;
}

// Creative Summary DTO
export class CreativeSummaryDto {
  @ApiProperty({
    description: 'Creative ID',
    example: 'creative-uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Creative name',
    example: 'Summer Banner Ad',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Creative type (video or image)',
    example: 'image',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Associated brand ID',
    example: 'brand-uuid-123',
    nullable: true,
  })
  brand_id?: string | null;
}

// Campaign KPI
export class CampaignKpiDto {
  @ApiProperty({
    description: 'Total number of campaigns',
    example: 15,
  })
  total_campaigns: number;

  @ApiProperty({
    description: 'Number of active campaigns',
    example: 5,
  })
  active_campaigns: number;

  @ApiProperty({
    description: 'Number of draft campaigns',
    example: 3,
  })
  draft_campaigns: number;

  @ApiProperty({
    description: 'Number of paused campaigns',
    example: 2,
  })
  paused_campaigns: number;

  @ApiProperty({
    description: 'Number of completed campaigns',
    example: 5,
  })
  completed_campaigns: number;

  @ApiProperty({
    description: 'Total budget allocated across all campaigns',
    example: 50000,
  })
  total_budget: number;

  @ApiProperty({
    description: 'Average budget per campaign',
    example: 3333.33,
  })
  average_budget: number;

  @ApiProperty({
    description: 'Total spent across all campaigns',
    example: 25000,
  })
  total_spent: number;

  @ApiProperty({
    description: 'Campaign distribution by status',
    example: {
      ACTIVE: 5,
      DRAFT: 3,
      PAUSED: 2,
      COMPLETED: 5,
      PENDING_VERIFICATION: 0,
      VERIFIED: 0,
      REJECTED: 0,
    },
  })
  status_distribution: {
    [key: string]: number;
  };

  @ApiProperty({
    description: 'Campaign distribution by goal',
    example: {
      AWARENESS: 3,
      CONVERSIONS: 5,
      TRAFFIC: 2,
      RETARGET: 1,
      APP_REVENUE: 1,
      LEADS: 1,
      SALES: 2,
    },
  })
  goal_distribution: {
    [key: string]: number;
  };

  @ApiProperty({
    description: 'Detailed list of all campaigns',
    type: [CampaignSummaryDto],
  })
  campaigns: CampaignSummaryDto[];
}

// Creative KPI
export class CreativeKpiDto {
  @ApiProperty({
    description: 'Total number of creatives',
    example: 45,
  })
  total_creatives: number;

  @ApiProperty({
    description: 'Number of video creatives',
    example: 25,
  })
  video_creatives: number;

  @ApiProperty({
    description: 'Number of image creatives',
    example: 20,
  })
  image_creatives: number;

  @ApiProperty({
    description: 'Number of creatives by brand',
    example: {
      'Brand A': 15,
      'Brand B': 20,
      Unbranded: 10,
    },
  })
  creatives_by_brand: {
    [key: string]: number;
  };

  @ApiProperty({
    description: 'Average number of creatives per campaign',
    example: 3.0,
  })
  avg_creatives_per_campaign: number;

  @ApiProperty({
    description: 'Most used creatives (by ad variation count)',
    example: [
      { id: 'creative-1', name: 'Summer Promo Video', usage_count: 12 },
      { id: 'creative-2', name: 'Winter Sale Banner', usage_count: 8 },
    ],
  })
  top_creatives: Array<{
    id: string;
    name: string;
    usage_count: number;
  }>;

  @ApiProperty({
    description: 'Detailed list of all creatives',
    type: [CreativeSummaryDto],
  })
  creatives: CreativeSummaryDto[];
}

// Audience KPI
export class AudienceKpiDto {
  @ApiProperty({
    description: 'Total number of audiences',
    example: 120,
  })
  total_audiences: number;

  @ApiProperty({
    description: 'Audience distribution by type',
    example: {
      DEMOGRAPHIC: 45,
      INTEREST: 35,
      GEOGRAPHY: 25,
      BEHAVIOR: 10,
      CHANNEL: 3,
      DELIVERY_TIME: 2,
    },
  })
  audience_by_type: {
    [key: string]: number;
  };

  @ApiProperty({
    description: 'Average number of audiences per ad variation',
    example: 2.5,
  })
  avg_audiences_per_variation: number;

  @ApiProperty({
    description: 'Top audiences by usage',
    example: [
      {
        id: 'audience-1',
        name: 'Age 25-34',
        type: 'DEMOGRAPHIC',
        usage_count: 8,
        total_size: 5000000,
      },
      {
        id: 'audience-2',
        name: 'Tech Enthusiasts',
        type: 'INTEREST',
        usage_count: 6,
        total_size: 2500000,
      },
    ],
  })
  top_audiences: Array<{
    id: string;
    name: string;
    type: string;
    usage_count: number;
    total_size?: string;
  }>;

  @ApiProperty({
    description: 'Total unique audience size across all audiences',
    example: '15000000',
  })
  total_audience_reach: string;

  @ApiProperty({
    description: 'Detailed list of all audiences',
  })
  audiences: Array<{
    id: string;
    name: string;
    type: string;
    size?: string;
    reached?: string;
  }>;
}

// Ad Variation KPI
export class AdVariationKpiDto {
  @ApiProperty({
    description: 'Total number of ad variations',
    example: 35,
  })
  total_variations: number;

  @ApiProperty({
    description: 'Number of active variations',
    example: 12,
  })
  active_variations: number;

  @ApiProperty({
    description: 'Average variations per campaign',
    example: 2.33,
  })
  avg_variations_per_campaign: number;

  @ApiProperty({
    description: 'Bidding strategy distribution',
    example: {
      AUTOMATIC: 20,
      MANUAL_CPM: 15,
    },
  })
  bidding_strategy_distribution: {
    [key: string]: number;
  };

  @ApiProperty({
    description: 'Average CPM bid',
    example: 5.5,
  })
  average_cpm: number;

  @ApiProperty({
    description: 'Detailed list of all ad variations',
  })
  ad_variations: Array<{
    id: string;
    name: string;
    is_active: boolean;
    bidding_strategy: string;
    cpm_bid?: number;
    campaign_id?: string;
  }>;
}

// Comprehensive Organization KPI
export class OrganisationKpiDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'org-uuid-123',
  })
  organization_id: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corp',
  })
  organization_name: string;

  @ApiProperty({
    description: 'Owner email (contact details)',
    example: 'owner@acmecorp.com',
  })
  owner_email: string;

  @ApiPropertyOptional({
    description: 'Owner full name',
    example: 'John Doe',
    nullable: true,
  })
  owner_name?: string | null;

  @ApiProperty({
    description: 'Date when organization was created',
    example: '2025-01-15T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Campaign KPI metrics',
  })
  campaigns: CampaignKpiDto;

  @ApiProperty({
    description: 'Creative KPI metrics',
  })
  creatives: CreativeKpiDto;

  @ApiProperty({
    description: 'Audience KPI metrics',
  })
  audiences: AudienceKpiDto;

  @ApiProperty({
    description: 'Ad Variation KPI metrics',
  })
  ad_variations: AdVariationKpiDto;

  @ApiProperty({
    description: 'List of related brands',
    type: [BrandInfoDto],
  })
  related_brands: BrandInfoDto[];

  @ApiProperty({
    description: 'List of related campaigns',
    type: [CampaignSummaryDto],
  })
  related_campaigns: CampaignSummaryDto[];

  @ApiProperty({
    description: 'List of related creatives',
    type: [CreativeSummaryDto],
  })
  related_creatives: CreativeSummaryDto[];

  @ApiPropertyOptional({
    description: 'Timestamp when KPI was calculated',
    example: '2025-12-26T10:00:00Z',
  })
  calculated_at: Date;
}

// Simplified KPI for list view
export class OrganisationKpiSummaryDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'org-uuid-123',
  })
  organization_id: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corp',
  })
  organization_name: string;

  @ApiProperty({
    description: 'Total campaigns',
    example: 15,
  })
  total_campaigns: number;

  @ApiProperty({
    description: 'Active campaigns',
    example: 5,
  })
  active_campaigns: number;

  @ApiProperty({
    description: 'Total creatives',
    example: 45,
  })
  total_creatives: number;

  @ApiProperty({
    description: 'Total audiences',
    example: 120,
  })
  total_audiences: number;

  @ApiProperty({
    description: 'Total budget',
    example: 50000,
  })
  total_budget: number;

  @ApiProperty({
    description: 'Total spent',
    example: 25000,
  })
  total_spent: number;

  @ApiPropertyOptional({
    description: 'User role in this organization',
    example: 'owner',
    enum: ['owner', 'admin', 'member'],
  })
  user_role?: string;
}

// Multiple Organizations KPI
export class MultipleOrganisationsKpiDto {
  @ApiProperty({
    description: 'List of KPI summaries for all user organizations',
    type: [OrganisationKpiSummaryDto],
  })
  organizations: OrganisationKpiSummaryDto[];

  @ApiProperty({
    description: 'Total number of organizations',
    example: 3,
  })
  total_organizations: number;

  @ApiProperty({
    description: 'Combined stats across all organizations',
    example: {
      total_campaigns: 45,
      total_creatives: 120,
      total_audiences: 350,
      total_budget: 150000,
    },
  })
  combined_stats: {
    total_campaigns: number;
    total_creatives: number;
    total_audiences: number;
    total_budget: number;
  };
}
