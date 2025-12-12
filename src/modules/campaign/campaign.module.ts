import { Module } from '@nestjs/common';
import { CampaignService } from './services';
import { CampaignController } from './controllers/campaign.controller';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [TaskModule],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
