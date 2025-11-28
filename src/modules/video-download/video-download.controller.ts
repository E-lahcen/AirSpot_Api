import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { VideoDownloadService } from './services/video-download.service';
import { DownloadVideoDto } from './dto/download-video.dto';
import { UpdateVideoDownloadDto } from './dto/update-video-download.dto';
import { AuthGuard } from '@app/modules/auth/guards';
import {
  CurrentUser,
  AuthenticatedUser,
  Public,
} from '@app/modules/auth/decorators';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Video Download')
@Controller('video-download')
@UseGuards(AuthGuard)
export class VideoDownloadController {
  constructor(private readonly videoDownloadService: VideoDownloadService) {}

  @Post()
  @ApiOperation({ summary: 'Download video from URL' })
  async downloadVideo(
    @Body() downloadVideoDto: DownloadVideoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.videoDownloadService.downloadVideo(
      downloadVideoDto.videoUrl,
      undefined, // tenantSlug - will be extracted from header via TenantService
      user,
    );

    // If download was successful, add public URL
    if ('videoPath' in result) {
      const baseUrl = process.env.APP_URL || 'https://airspot-dev-api.fly.dev';
      return {
        ...result,
        publicUrl: `${baseUrl}/api/v1/video-download/public/file/${encodeURIComponent(result.videoPath)}`,
      };
    }

    return result;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Upload video from device (MP4 only, max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'MP4 video file to upload (max 25MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Video uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          example:
            'creatives/test-test/3878d1f3-2e29-46ec-b924-1be2fd47bf84.mp4',
        },
        filename: {
          type: 'string',
          example: '3878d1f3-2e29-46ec-b924-1be2fd47bf84.mp4',
        },
        publicUrl: {
          type: 'string',
          example:
            'https://airspot-dev-api.fly.dev/api/v1/video-download/public/file/creatives/test-test/3878d1f3-2e29-46ec-b924-1be2fd47bf84.mp4',
        },
      },
    },
  })
  async uploadVideoFromDevice(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      return { errorKey: 'invalid_url' };
    }
    const result = await this.videoDownloadService.uploadVideoFromDevice(
      file,
      undefined, // tenantSlug - will be extracted from header via TenantService
      user,
    );

    // If upload was successful, add public URL
    if ('videoPath' in result) {
      const baseUrl = process.env.APP_URL || 'https://airspot-dev-api.fly.dev';
      return {
        ...result,
        publicUrl: `${baseUrl}/api/v1/video-download/public/file/${encodeURIComponent(result.videoPath)}`,
      };
    }

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all downloaded videos for the current tenant' })
  @ApiResponse({
    status: 200,
    description: 'List of downloaded videos',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            example: '3878d1f3-2e29-46ec-b924-1be2fd47bf84.mp4',
          },
          videoPath: {
            type: 'string',
            example:
              'creatives/test-test/3878d1f3-2e29-46ec-b924-1be2fd47bf84.mp4',
          },
          publicUrl: {
            type: 'string',
            example:
              'https://airspot-dev-api.fly.dev/api/v1/video-download/public/file/creatives/test-test/3878d1f3-2e29-46ec-b924-1be2fd47bf84.mp4',
          },
          size: { type: 'number', example: 5242880 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const videos = await this.videoDownloadService.findAll(undefined, user);
    const baseUrl = process.env.APP_URL || 'https://airspot-dev-api.fly.dev';

    return videos.map((video) => ({
      ...video,
      publicUrl: `${baseUrl}/api/v1/video-download/public/file/${encodeURIComponent(video.videoPath)}`,
    }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videoDownloadService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVideoDownloadDto: UpdateVideoDownloadDto,
  ) {
    return this.videoDownloadService.update(+id, updateVideoDownloadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videoDownloadService.remove(+id);
  }
}

@ApiTags('Video Download')
@Controller('video-download/public')
export class VideoDownloadPublicController {
  constructor(private readonly videoDownloadService: VideoDownloadService) {}

  @Get('file/*')
  @Public()
  @ApiOperation({ summary: 'Get video file (public access)' })
  @ApiResponse({
    status: 200,
    description: 'Video file retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Video file not found',
  })
  async getVideoFile(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the file path from the request URL
      // The URL format is: /api/v1/video-download/public/file/creatives/...
      // We need to extract everything after '/file/'
      const url = req.url || req.path;
      const filePathMatch = url.match(/\/file\/(.+)$/);

      if (!filePathMatch || !filePathMatch[1]) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Invalid file path',
          error: 'Bad Request',
        });
      }

      const videoPath = decodeURIComponent(filePathMatch[1]);
      const { buffer, mimeType } =
        await this.videoDownloadService.getVideoFile(videoPath);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Accept-Ranges', 'bytes'); // Support range requests for video streaming
      res.send(buffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({
          statusCode: 404,
          message: 'Video file not found',
          error: 'Not Found',
        });
      } else {
        res.status(500).json({
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        });
      }
    }
  }
}
