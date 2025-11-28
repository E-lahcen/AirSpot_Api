import { Test, TestingModule } from '@nestjs/testing';
import { VideoDownloadService } from './services/video-download.service';

describe('VideoDownloadService', () => {
  let service: VideoDownloadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoDownloadService],
    }).compile();

    service = module.get<VideoDownloadService>(VideoDownloadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
