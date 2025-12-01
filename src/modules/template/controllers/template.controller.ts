import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { basename } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto, ImageType, FilterTemplateDto } from '../dto';
import { AuthGuard } from '@app/modules/auth/guards';
import {
  CurrentUser,
  AuthenticatedUser,
  Public,
} from '@app/modules/auth/decorators';

@ApiTags('Templates')
@ApiBearerAuth()
@Controller('templates')
@UseGuards(AuthGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload image (logo or product image)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (max 10MB)',
        },
        imageType: {
          type: 'string',
          enum: ['logo', 'productImage'],
          description: 'Type of image being uploaded',
          default: 'productImage',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        imagePath: {
          type: 'string',
          example: 'templates/test-test/images/abc123.jpg',
        },
        filename: { type: 'string', example: 'abc123.jpg' },
      },
    },
  })
  uploadImage(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    @Query('imageType') imageType: ImageType = ImageType.PRODUCT_IMAGE,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      return { errorKey: 'invalid_file' };
    }
    return this.templateService.uploadImage(file, imageType, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({
    status: 200,
    description: 'List of templates retrieved successfully',
  })
  findAll(@Query() filterDto: FilterTemplateDto) {
    return this.templateService.findAll(filterDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
  })
  async createTemplate(
    @Body() createTemplateDto: CreateTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const template = await this.templateService.createTemplate(
      createTemplateDto,
      user,
    );

    // Extract filename from template_image_path if it exists
    let filename: string | null = null;
    if (template.template_image_path) {
      filename = basename(template.template_image_path);
    }

    return {
      ...template,
      filename,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async getTemplate(@Param('id', ParseUUIDPipe) id: string) {
    const template = await this.templateService.findOne(id);

    // Generate public URLs for the template files
    const baseUrl = process.env.APP_URL || 'https://airspot-backend.dba.ma';
    return {
      ...template,
      publicLinks: {
        templateImage: template.template_image_path
          ? `${baseUrl}/api/v1/templates/public/file/${encodeURIComponent(template.template_image_path)}`
          : null,
        video: template.video_path
          ? `${baseUrl}/api/v1/templates/public/file/${encodeURIComponent(template.video_path)}`
          : null,
        logo: template.logo_path
          ? `${baseUrl}/api/v1/templates/public/file/${encodeURIComponent(template.logo_path)}`
          : null,
        productImage: template.product_image_path
          ? `${baseUrl}/api/v1/templates/public/file/${encodeURIComponent(template.product_image_path)}`
          : null,
      },
    };
  }

  @Post(':id/generate-video')
  @ApiOperation({ summary: 'Generate video from template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template video generated successfully',
    schema: {
      type: 'object',
      properties: {
        videoPath: {
          type: 'string',
          example: 'templates/test-test/videos/abc123.mp4',
        },
        filename: { type: 'string', example: 'abc123.mp4' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Template video path is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found or input video not found',
  })
  async generateTemplateVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.templateService.generateTemplateVideo(id, user);
    const baseUrl = process.env.APP_URL || 'https://airspot-backend.dba.ma';
    return {
      ...result,
      publicUrl: `${baseUrl}/api/v1/video-download/public/file/${encodeURIComponent(result.videoPath)}`,
    };
  }
}

@ApiTags('Templates')
@Controller('templates/public')
export class TemplatePublicController {
  constructor(private readonly templateService: TemplateService) {}

  @Get('file/*')
  @Public()
  @ApiOperation({ summary: 'Get template file (public access)' })
  @ApiResponse({
    status: 200,
    description: 'File retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async getFile(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the file path from the request URL
      // The URL format is: /api/v1/templates/public/file/templates/...
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

      const filePath = decodeURIComponent(filePathMatch[1]);
      const { buffer, mimeType } =
        await this.templateService.getTemplateFile(filePath);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(buffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({
          statusCode: 404,
          message: 'File not found',
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
