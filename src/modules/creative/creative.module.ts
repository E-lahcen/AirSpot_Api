import { Module } from '@nestjs/common';
import { CreativeService } from './services';
import { CreativeKpiService } from './services/creative-kpi.service';
import { CreativeController } from './controllers/creative.controller';
import { TemplateService } from '@app/modules/template/services/template.service';
import { StorageModule } from '@app/modules/storage/storage.module';
import { TenantModule } from '@app/modules/tenant/tenant.module';

@Module({
  imports: [StorageModule, TenantModule],
  controllers: [CreativeController],
  providers: [CreativeService, TemplateService, CreativeKpiService],
  exports: [CreativeService, CreativeKpiService],
})
export class CreativeModule {}
