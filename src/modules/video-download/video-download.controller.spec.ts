import { Test, TestingModule } from '@nestjs/testing';
import { VideoDownloadController } from './video-download.controller';
import { VideoDownloadService } from './services/video-download.service';

describe('VideoDownloadController', () => {
  let controller: VideoDownloadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoDownloadController],
      providers: [VideoDownloadService],
    }).compile();

    controller = module.get<VideoDownloadController>(VideoDownloadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
