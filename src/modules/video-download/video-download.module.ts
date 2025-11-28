import { Module } from '@nestjs/common';
import { VideoDownloadService } from './services/video-download.service';
import {
  VideoDownloadController,
  VideoDownloadPublicController,
} from './video-download.controller';

@Module({
  controllers: [VideoDownloadController, VideoDownloadPublicController],
  providers: [VideoDownloadService],
})
export class VideoDownloadModule {}
