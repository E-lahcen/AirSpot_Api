/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { AdVariation } from '../entities/ad-variation.entity';
import { Campaign } from '@app/modules/campaign/entities/campaign.entity';
import { AdVariationKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';

@Injectable()
export class AdVariationKpiService {
  /**
   * Get ad variation KPI for a specific organization/tenant
   */

  async getAdVariationKpi(manager: any): Promise<AdVariationKpiDto> {
    const adVariationRepo = manager.getRepository(AdVariation);
    const campaignRepo = manager.getRepository(Campaign);

    const variations = await adVariationRepo.find();
    const totalVariations = variations.length;

    // Count active variations
    const activeVariations = variations.filter(
      (v: any) => v.is_active || v.active,
    ).length;

    // Count by bidding strategy
    const biddingStrategyDistribution: Record<string, number> = {
      AUTOMATIC: 0,
      MANUAL_CPM: 0,
    };

    let totalCpmBids = 0;
    let cpmBidCount = 0;

    variations.forEach((variation) => {
      const strategy = variation.bidding_strategy as string;
      if (strategy in biddingStrategyDistribution) {
        biddingStrategyDistribution[strategy]++;
      }

      if (variation.cpm_bid) {
        totalCpmBids += Number(variation.cpm_bid);
        cpmBidCount++;
      }
    });

    // Average variations per campaign

    const totalCampaigns = await campaignRepo.count();

    // Map variations to summary format

    const variationSummaries = variations.map((variation: any) => ({
      id: variation.id,
      name: variation.name || `Ad Variation ${variation.id.slice(0, 8)}`,
      is_active: variation.is_active || variation.active,
      bidding_strategy: variation.bidding_strategy,
      cpm_bid: variation.cpm_bid || undefined,
      campaign_id: variation.campaign_id || undefined,
    }));

    return {
      total_variations: totalVariations,
      active_variations: activeVariations,
      avg_variations_per_campaign:
        totalCampaigns > 0 ? totalVariations / totalCampaigns : 0,
      bidding_strategy_distribution: biddingStrategyDistribution,
      average_cpm: cpmBidCount > 0 ? totalCpmBids / cpmBidCount : 0,
      ad_variations: variationSummaries,
    };
  }
}
