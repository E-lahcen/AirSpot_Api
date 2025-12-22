import { Injectable, Logger } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { PerformanceRecord } from '../entities/performance-record.entity';
import { TimeDistribution } from '../entities/time-distribution.entity';
import { ReachMetrics } from '../entities/reach-metrics.entity';
import { CampaignSummary } from '../entities/campaign-summary.entity';
import { Campaign } from '../entities/campaign.entity';
import { BulkUpsertCampaignMetricsDto } from '../dto/bulk-upsert-metrics.dto';

@Injectable()
export class CampaignMetricsService {
  private readonly logger = new Logger(CampaignMetricsService.name);

  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async bulkUpsertMetrics(dto: BulkUpsertCampaignMetricsDto): Promise<{
    success: boolean;
    message: string;
    data: {
      campaignId: string;
      performanceRecordsCount: number;
      timeDistributionCount: number;
      reachMetricsUpdated: boolean;
      summaryUpdated: boolean;
    };
  }> {
    const manager = await this.tenantConnection.getEntityManager();

    // Use the manager's transaction method
    return await manager.transaction(async (transactionManager) => {
      try {
        // 1. Verify campaign exists
        const campaignRepo = transactionManager.getRepository(Campaign);
        const campaign = await campaignRepo.findOne({
          where: { id: dto.campaignId },
        });

        if (!campaign) {
          throw new Error(`Campaign with ID ${dto.campaignId} not found`);
        }

        this.logger.log(`Upserting metrics for campaign ${dto.campaignId}`);

        // 2. Upsert Performance Records
        const performanceRepo =
          transactionManager.getRepository(PerformanceRecord);
        const performanceRecords = [];

        for (const record of dto.performanceRecords) {
          // Check if record exists
          const existing = await performanceRepo.findOne({
            where: {
              tenantId: record.tenantId,
              campaignId: record.campaignId,
              date: record.date,
              publisherName: record.publisherName,
            },
          });

          if (existing) {
            // Update existing record
            await performanceRepo.update(existing.id, {
              impressions: record.impressions,
              spend: record.spend,
              cpm: record.cpm,
            });
            performanceRecords.push(existing);
          } else {
            // Create new record
            const newRecord = performanceRepo.create({
              tenantId: record.tenantId,
              campaignId: record.campaignId,
              date: record.date,
              publisherName: record.publisherName,
              impressions: record.impressions,
              spend: record.spend,
              cpm: record.cpm,
            });
            const saved = await performanceRepo.save(newRecord);
            performanceRecords.push(saved);
          }
        }

        // 3. Upsert Time Distribution
        const timeDistRepo = transactionManager.getRepository(TimeDistribution);
        const timeDistributions = [];

        for (const dist of dto.timeDistribution) {
          const existing = await timeDistRepo.findOne({
            where: {
              tenantId: dist.tenantId,
              campaignId: dist.campaignId,
              hour: dist.hour,
            },
          });

          if (existing) {
            await timeDistRepo.update(existing.id, {
              impressions: dist.impressions,
              percentage: dist.percentage,
            });
            timeDistributions.push(existing);
          } else {
            const newDist = timeDistRepo.create({
              tenantId: dist.tenantId,
              campaignId: dist.campaignId,
              hour: dist.hour,
              impressions: dist.impressions,
              percentage: dist.percentage,
            });
            const saved = await timeDistRepo.save(newDist);
            timeDistributions.push(saved);
          }
        }

        // 4. Upsert Reach Metrics (OneToOne relationship)
        const reachRepo = transactionManager.getRepository(ReachMetrics);
        let reachMetrics = await reachRepo.findOne({
          where: {
            tenantId: dto.reachMetrics.tenantId,
            campaignId: dto.reachMetrics.campaignId,
          },
        });

        if (reachMetrics) {
          await reachRepo.update(reachMetrics.id, {
            totalImpressions: dto.reachMetrics.totalImpressions,
            uniqueHouseholds: dto.reachMetrics.uniqueHouseholds,
            frequencyPerHousehold: dto.reachMetrics.frequencyPerHousehold,
          });
        } else {
          const newReach = reachRepo.create({
            tenantId: dto.reachMetrics.tenantId,
            campaignId: dto.reachMetrics.campaignId,
            totalImpressions: dto.reachMetrics.totalImpressions,
            uniqueHouseholds: dto.reachMetrics.uniqueHouseholds,
            frequencyPerHousehold: dto.reachMetrics.frequencyPerHousehold,
          });
          reachMetrics = await reachRepo.save(newReach);
        }

        // 5. Upsert Campaign Summary (OneToOne relationship)
        const summaryRepo = transactionManager.getRepository(CampaignSummary);
        let summary = await summaryRepo.findOne({
          where: {
            tenantId: dto.campaignSummary.tenantId,
            campaignId: dto.campaignSummary.campaignId,
          },
        });

        if (summary) {
          await summaryRepo.update(summary.id, {
            totalImpressions: dto.campaignSummary.totalImpressions,
            totalSpend: dto.campaignSummary.totalSpend,
            averageCPM: dto.campaignSummary.averageCPM,
            uniqueHouseholds: dto.campaignSummary.uniqueHouseholds,
            averageFrequency: dto.campaignSummary.averageFrequency,
            totalPublishers: dto.campaignSummary.totalPublishers,
            activeDays: dto.campaignSummary.activeDays,
            startDate: dto.campaignSummary.startDate,
            endDate: dto.campaignSummary.endDate,
            lastCalculatedAt: dto.campaignSummary.lastCalculatedAt,
          });
        } else {
          const newSummary = summaryRepo.create({
            tenantId: dto.campaignSummary.tenantId,
            campaignId: dto.campaignSummary.campaignId,
            totalImpressions: dto.campaignSummary.totalImpressions,
            totalSpend: dto.campaignSummary.totalSpend,
            averageCPM: dto.campaignSummary.averageCPM,
            uniqueHouseholds: dto.campaignSummary.uniqueHouseholds,
            averageFrequency: dto.campaignSummary.averageFrequency,
            totalPublishers: dto.campaignSummary.totalPublishers,
            activeDays: dto.campaignSummary.activeDays,
            startDate: dto.campaignSummary.startDate,
            endDate: dto.campaignSummary.endDate,
            lastCalculatedAt: dto.campaignSummary.lastCalculatedAt,
          });
          summary = await summaryRepo.save(newSummary);
        }

        this.logger.log(
          `Successfully upserted metrics for campaign ${dto.campaignId}`,
        );

        return {
          success: true,
          message: 'Campaign metrics upserted successfully',
          data: {
            campaignId: dto.campaignId,
            performanceRecordsCount: performanceRecords.length,
            timeDistributionCount: timeDistributions.length,
            reachMetricsUpdated: !!reachMetrics,
            summaryUpdated: !!summary,
          },
        };
      } catch (error: unknown) {
        const err = error as { stack?: string } | Error;
        this.logger.error(
          `Error upserting metrics for campaign ${dto.campaignId}`,
          (err as Error)?.stack ??
            (typeof error === 'string' ? error : JSON.stringify(error)),
        );
        throw error;
      }
    });
  }

  async getCampaignMetrics(
    campaignId: string,
    tenantId: string,
  ): Promise<{
    campaign: Campaign;
    performanceRecords: PerformanceRecord[];
    timeDistribution: TimeDistribution[];
    reachMetrics: ReachMetrics;
    summary: CampaignSummary;
  }> {
    const campaignRepo = await this.tenantConnection.getRepository(Campaign);
    const performanceRepo =
      await this.tenantConnection.getRepository(PerformanceRecord);
    const timeDistRepo =
      await this.tenantConnection.getRepository(TimeDistribution);
    const reachRepo = await this.tenantConnection.getRepository(ReachMetrics);
    const summaryRepo =
      await this.tenantConnection.getRepository(CampaignSummary);

    const campaign = await campaignRepo.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    const performanceRecords = await performanceRepo.find({
      where: { campaignId, tenantId },
      order: { date: 'ASC' },
    });

    const timeDistribution = await timeDistRepo.find({
      where: { campaignId, tenantId },
      order: { hour: 'ASC' },
    });

    const reachMetrics = await reachRepo.findOne({
      where: { campaignId, tenantId },
    });

    const summary = await summaryRepo.findOne({
      where: { campaignId, tenantId },
    });

    return {
      campaign,
      performanceRecords,
      timeDistribution,
      reachMetrics,
      summary,
    };
  }
}
