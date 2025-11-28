import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadVideoFromDeviceDto {
  @ApiProperty({
    description: 'Path of the video to upload',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  video: string;
}
