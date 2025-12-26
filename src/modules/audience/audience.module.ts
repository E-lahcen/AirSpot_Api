import { Module } from '@nestjs/common';
import { AudienceService } from './services';
import { AudienceKpiService } from './services/audience-kpi.service';
import { AudienceController } from './controllers/audience.controller';
import { TenantModule } from '@app/modules/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [AudienceController],
  providers: [AudienceService, AudienceKpiService],
  exports: [AudienceService, AudienceKpiService],
})
export class AudienceModule {}
