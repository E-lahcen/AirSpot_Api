import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateStoryboardController } from './controllers/template-storyboard.controller';
import { TemplateStoryboardService } from './services/template-storyboard.service';
import { TemplateStoryboard } from './entities/template-storyboard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateStoryboard])],
  controllers: [TemplateStoryboardController],
  providers: [TemplateStoryboardService],
  exports: [TemplateStoryboardService],
})
export class TemplateStoryboardModule {}
