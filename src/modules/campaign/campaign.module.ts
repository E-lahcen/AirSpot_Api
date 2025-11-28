import { Module } from '@nestjs/common';
import { CampaignService } from './services';
import { CampaignController } from './controllers/campaign.controller';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
