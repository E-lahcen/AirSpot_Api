import { Module } from '@nestjs/common';
import { CampaignService, CampaignMetricsService } from './services';
import { CampaignController } from './controllers/campaign.controller';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [TaskModule],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignMetricsService],
  exports: [CampaignService, CampaignMetricsService],
})
export class CampaignModule {}
