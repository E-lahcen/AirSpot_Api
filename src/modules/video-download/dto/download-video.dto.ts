import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DownloadVideoDto {
  @ApiProperty({
    description: 'URL of the video to download',
    example: 'https://www.tiktok.com/@user/video/1234567890',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  videoUrl: string;
}
