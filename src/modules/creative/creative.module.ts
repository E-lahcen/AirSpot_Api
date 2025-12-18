import { Module } from '@nestjs/common';
import { CreativeService } from './services';
import { CreativeController } from './controllers/creative.controller';
import { TemplateService } from '@app/modules/template/services/template.service';
import { StorageModule } from '@app/modules/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [CreativeController],
  providers: [CreativeService, TemplateService],
  exports: [CreativeService],
})
export class CreativeModule {}
