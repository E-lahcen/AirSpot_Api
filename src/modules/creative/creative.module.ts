import { Module } from '@nestjs/common';
import { CreativeService } from './services';
import { CreativeController } from './controllers/creative.controller';
import { TemplateService } from '@app/modules/template/services/template.service';

@Module({
  controllers: [CreativeController],
  providers: [CreativeService, TemplateService],
  exports: [CreativeService],
})
export class CreativeModule {}
