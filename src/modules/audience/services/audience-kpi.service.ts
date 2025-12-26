/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { Audience } from '../entities/audience.entity';
import { AdVariation } from '@app/modules/ad-variation/entities/ad-variation.entity';
import { AudienceKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';

@Injectable()
export class AudienceKpiService {
  /**
   * Get audience KPI for a specific organization/tenant
   */

  async getAudienceKpi(manager: any): Promise<AudienceKpiDto> {
    const audienceRepo = manager.getRepository(Audience);
    const adVariationRepo = manager.getRepository(AdVariation);

    const audiences = await audienceRepo.find();
    const totalAudiences = audiences.length;

    // Count by type
    const audienceByType: Record<string, number> = {
      DEMOGRAPHIC: 0,
      INTEREST: 0,
      GEOGRAPHY: 0,
      BEHAVIOR: 0,
      CHANNEL: 0,
      DELIVERY_TIME: 0,
    };

    let totalAudienceReach = '0';

    audiences.forEach((audience) => {
      const type = audience.type as string;
      if (type in audienceByType) {
        audienceByType[type]++;
      }

      // Try to sum up audience reach (parse as numbers)
      const reachNum = parseInt(audience.reached || '0', 10);
      const currentNum = parseInt(totalAudienceReach || '0', 10);
      totalAudienceReach = (currentNum + reachNum).toString();
    });

    // Get top audiences by usage in ad variations
    const topAudienceUsage = await adVariationRepo
      .createQueryBuilder('av')
      .leftJoinAndSelect('av.audiences', 'audience')
      .select('audience.id as id')
      .addSelect('COUNT(av.id)', 'usage_count')
      .groupBy('audience.id')
      .orderBy('usage_count', 'DESC')
      .limit(10)
      .getRawMany();

    const topAudiences = (audiences as any[])
      .map((audience) => {
        const usage = topAudienceUsage.find(
          (item: any) => item.id === audience.id,
        );
        return {
          id: audience.id,
          name: audience.name,
          type: audience.type,

          usage_count: usage ? parseInt(usage.usage_count as string, 10) : 0,
          total_size: audience.size,
        };
      })
      .filter((a) => a.usage_count > 0)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // Average audiences per variation
    const totalVariations = await adVariationRepo.count();

    // Map audiences to summary format
    const audienceSummaries = audiences.map((audience) => ({
      id: audience.id,
      name: audience.name,
      type: audience.type,
      size: audience.size || undefined,
      reached: audience.reached || undefined,
    }));

    return {
      total_audiences: totalAudiences,
      audience_by_type: audienceByType,
      avg_audiences_per_variation:
        totalVariations > 0 ? totalAudiences / totalVariations : 0,
      top_audiences: topAudiences,
      total_audience_reach: totalAudienceReach,
      audiences: audienceSummaries,
    };
  }
}
