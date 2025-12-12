import { Module } from '@nestjs/common';
import { TaskTemplateService } from './services/task-template.service';
import { TaskTemplateController } from './controllers/task-template.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [TaskTemplateController],
  providers: [TaskTemplateService],
  exports: [TaskTemplateService],
})
export class TaskTemplateModule {}
