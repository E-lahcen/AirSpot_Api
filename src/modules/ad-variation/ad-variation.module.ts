import { Module } from '@nestjs/common';
import { AdVariationService } from './services';
import { AdVariationController } from './controllers/ad-variation.controller';

@Module({
  controllers: [AdVariationController],
  providers: [AdVariationService],
  exports: [AdVariationService],
})
export class AdVariationModule {}
