import { Module } from '@nestjs/common';
import { CampaignService, CampaignMetricsService } from './services';
import { CampaignKpiService } from './services/campaign-kpi.service';
import { CampaignController } from './controllers/campaign.controller';
import { TaskModule } from '../task/task.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TaskModule, TenantModule],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignMetricsService, CampaignKpiService],
  exports: [CampaignService, CampaignMetricsService, CampaignKpiService],
})
export class CampaignModule {}
