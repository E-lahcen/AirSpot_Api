import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TemplateController,
  TemplatePublicController,
} from './controllers/template.controller';
import { TemplateService } from './services/template.service';
import { Template } from './entities/template.entity';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TypeOrmModule.forFeature([Template]), TenantModule],
  controllers: [TemplateController, TemplatePublicController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
