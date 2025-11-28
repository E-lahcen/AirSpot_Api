import { PartialType } from '@nestjs/mapped-types';
import { DownloadVideoDto } from './download-video.dto';

export class UpdateVideoDownloadDto extends PartialType(DownloadVideoDto) {}
