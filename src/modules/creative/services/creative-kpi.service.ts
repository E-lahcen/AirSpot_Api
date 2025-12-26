/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { Creative } from '../entities/creative.entity';
import { AdVariation } from '@app/modules/ad-variation/entities/ad-variation.entity';
import { Campaign } from '@app/modules/campaign/entities/campaign.entity';
import { CreativeKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';

@Injectable()
export class CreativeKpiService {
  /**
   * Get creative KPI for a specific organization/tenant
   */

  async getCreativeKpi(manager: any): Promise<CreativeKpiDto> {
    const creativeRepo = manager.getRepository(Creative);
    const adVariationRepo = manager.getRepository(AdVariation);
    const campaignRepo = manager.getRepository(Campaign);

    const creatives = await creativeRepo.find();

    const totalCreatives = creatives.length;

    // Count by type (infer from mime_type or default to image if not specified)
    let videoCreatives = 0;
    let imageCreatives = 0;

    creatives.forEach((creative) => {
      // Check if it's a video (based on common assumptions)
      const mimeType = creative.mime_type as string;
      if (mimeType?.startsWith('video')) {
        videoCreatives++;
      } else {
        imageCreatives++;
      }
    });

    // Count by brand
    const creativesbyBrand: Record<string, number> = {};
    creatives.forEach((creative) => {
      const brandName = creative.brand_name || 'Unbranded';
      creativesbyBrand[brandName] = (creativesbyBrand[brandName] || 0) + 1;
    });

    // Average creatives per campaign
    const totalCampaigns = await campaignRepo.count();

    // Get top creatives by usage in ad variations
    const topCreatives = await adVariationRepo
      .createQueryBuilder('av')
      .select('av.creative_id as id')
      .addSelect('COUNT(av.id)', 'usage_count')
      .groupBy('av.creative_id')
      .orderBy('usage_count', 'DESC')
      .limit(10)
      .getRawMany();

    // Enrich top creatives with names

    const enrichedTopCreatives = topCreatives
      .filter((item: any) => item.id) // Filter out null creative_ids
      .map((item: any) => {
        const creative = creatives.find((c) => c.id === (item.id as string));
        return {
          id: item.id as string,
          name: creative?.name || 'Unknown',

          usage_count: parseInt(item.usage_count as string, 10),
        };
      });

    // Map creatives to summary format
    const creativeSummaries = creatives.map((creative) => ({
      id: creative.id,
      name: creative.name,
      type: (creative.mime_type as string)?.startsWith('video')
        ? 'video'
        : 'image',
      brand_id: creative.brand_id || null,
    }));

    return {
      total_creatives: totalCreatives,
      video_creatives: videoCreatives,
      image_creatives: imageCreatives,
      creatives_by_brand: creativesbyBrand,
      avg_creatives_per_campaign:
        totalCampaigns > 0 ? totalCreatives / totalCampaigns : 0,
      top_creatives: enrichedTopCreatives,
      creatives: creativeSummaries,
    };
  }
}
