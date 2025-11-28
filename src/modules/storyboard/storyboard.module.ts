import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoryboardController } from './controllers/storyboard.controller';
import { StoryboardService } from './services/storyboard.service';
import { Storyboard } from './entities/storyboard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Storyboard])],
  controllers: [StoryboardController],
  providers: [StoryboardService],
  exports: [StoryboardService],
})
export class StoryboardModule {}
