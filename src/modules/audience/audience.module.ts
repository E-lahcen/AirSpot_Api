import { Module } from '@nestjs/common';
import { AudienceService } from './services';
import { AudienceController } from './controllers/audience.controller';

@Module({
  controllers: [AudienceController],
  providers: [AudienceService],
  exports: [AudienceService],
})
export class AudienceModule {}
