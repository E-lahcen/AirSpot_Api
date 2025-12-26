import { Module } from '@nestjs/common';
import { AdVariationService } from './services';
import { AdVariationKpiService } from './services/ad-variation-kpi.service';
import { AdVariationController } from './controllers/ad-variation.controller';
import { TenantModule } from '@app/modules/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [AdVariationController],
  providers: [AdVariationService, AdVariationKpiService],
  exports: [AdVariationService, AdVariationKpiService],
})
export class AdVariationModule {}
