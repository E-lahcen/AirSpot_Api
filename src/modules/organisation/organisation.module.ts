import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganisationService } from './services/organisation.service';
import { OrganisationKpiService } from './services/organisation-kpi.service';
import { OrganisationController } from './controllers/organisation.controller';
import { CampaignModule } from '@app/modules/campaign/campaign.module';
import { CreativeModule } from '@app/modules/creative/creative.module';
import { AudienceModule } from '@app/modules/audience/audience.module';
import { AdVariationModule } from '@app/modules/ad-variation/ad-variation.module';
import { Brand } from '@app/modules/brand/entities/brand.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand]),
    CampaignModule,
    CreativeModule,
    AudienceModule,
    AdVariationModule,
  ],
  providers: [OrganisationService, OrganisationKpiService],
  controllers: [OrganisationController],
  exports: [OrganisationService, OrganisationKpiService],
})
export class OrganisationModule {}
