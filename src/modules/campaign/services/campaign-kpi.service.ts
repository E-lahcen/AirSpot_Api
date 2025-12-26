/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { Campaign } from '../entities/campaign.entity';
import { CampaignKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';

@Injectable()
export class CampaignKpiService {
  /**
   * Get campaign KPI for a specific organization/tenant
   */

  async getCampaignKpi(manager: any): Promise<CampaignKpiDto> {
    const campaignRepo = manager.getRepository(Campaign);

    const campaigns = await campaignRepo.find();
    const totalCampaigns = campaigns.length;

    // Count by status
    const statusDistribution: Record<string, number> = {
      DRAFT: 0,
      PENDING_VERIFICATION: 0,
      VERIFIED: 0,
      ACTIVE: 0,
      PAUSED: 0,
      COMPLETED: 0,
      REJECTED: 0,
    };

    // Count by goal
    const goalDistribution: Record<string, number> = {
      AWARENESS: 0,
      CONVERSIONS: 0,
      TRAFFIC: 0,
      RETARGET: 0,
      APP_REVENUE: 0,
      APP: 0,
      AUTOMATIC: 0,
      LEADS: 0,
      SALES: 0,
    };

    let totalBudget = 0;
    let totalSpent = 0;

    campaigns.forEach((campaign) => {
      const status = campaign.status as string;
      if (status in statusDistribution) {
        statusDistribution[status]++;
      }

      const goal = campaign.goal as string;
      if (goal in goalDistribution) {
        goalDistribution[goal]++;
      }

      totalBudget += Number(campaign.budget_amount || 0);
      totalSpent += Number(campaign.spend || 0);
    });

    const activeCampaigns = statusDistribution['ACTIVE'] || 0;
    const draftCampaigns = statusDistribution['DRAFT'] || 0;
    const pausedCampaigns = statusDistribution['PAUSED'] || 0;
    const completedCampaigns = statusDistribution['COMPLETED'] || 0;

    // Map campaigns to summary format
    const campaignSummaries = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status || 'DRAFT',
      budget: campaign.budget_amount || 0,
      spent: campaign.spend || 0,
    }));

    return {
      total_campaigns: totalCampaigns,
      active_campaigns: activeCampaigns,
      draft_campaigns: draftCampaigns,
      paused_campaigns: pausedCampaigns,
      completed_campaigns: completedCampaigns,
      total_budget: totalBudget,
      average_budget: totalCampaigns > 0 ? totalBudget / totalCampaigns : 0,
      total_spent: totalSpent,
      status_distribution: statusDistribution,
      goal_distribution: goalDistribution,
      campaigns: campaignSummaries,
    };
  }
}
