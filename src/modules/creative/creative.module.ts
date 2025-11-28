import { Module } from '@nestjs/common';
import { CreativeService } from './services';
import { CreativeController } from './controllers/creative.controller';

@Module({
  controllers: [CreativeController],
  providers: [CreativeService],
  exports: [CreativeService],
})
export class CreativeModule {}
