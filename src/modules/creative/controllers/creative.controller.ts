import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreativeService } from '../services';
import { CreativeKpiService } from '../services/creative-kpi.service';
import { CreateCreativeDto, UpdateCreativeDto } from '../dto';
import { FilterCreativeDto } from '../dto/filter-creative.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { CreativeKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';
import {
  ApiCreateCreative,
  ApiGetCreatives,
  ApiGetCreative,
  ApiUpdateCreative,
  ApiDeleteCreative,
} from '../docs';

@ApiTags('creatives')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('creatives')
export class CreativeController {
  constructor(
    private readonly creativeService: CreativeService,
    private readonly creativeKpiService: CreativeKpiService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  @ApiCreateCreative()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description:
            'MP4 video file (1920x1080, 16:9 aspect ratio, max 100MB) - Optional',
        },
        organization_id: { type: 'string' },
        brand_id: { type: 'string', description: 'Brand UUID - Optional' },
        name: { type: 'string' },
        description: { type: 'string' },
        orientation: { type: 'string' },
        theme: { type: 'string' },
        video_position: { type: 'string' },
        brand_name: { type: 'string' },
        price: { type: 'string' },
        product_name: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        show_qr_code: { type: 'boolean' },
        qr_code_text: { type: 'string' },
        logo_path: { type: 'string' },
        product_image_path: { type: 'string' },
        template_image_path: { type: 'string' },
        file_name: { type: 'string' },
        id_template: { type: 'string' },
      },
    },
  })
  async create(
    @Body() createCreativeDto: CreateCreativeDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
          new FileTypeValidator({ fileType: 'video/mp4' }),
        ],
        fileIsRequired: false,
      }),
    )
    video:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.creativeService.create(
      createCreativeDto,
      user.id,
      user.tenantId,
      user,
      video,
    );
  }

  @Get()
  @ApiGetCreatives()
  findAll(@Query() filterDto: FilterCreativeDto) {
    return this.creativeService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetCreative()
  findOne(@Param('id') id: string) {
    return this.creativeService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateCreative()
  update(
    @Param('id') id: string,
    @Body() updateCreativeDto: UpdateCreativeDto,
  ) {
    return this.creativeService.update(id, updateCreativeDto);
  }

  @Delete(':id')
  @ApiDeleteCreative()
  remove(@Param('id') id: string) {
    return this.creativeService.remove(id);
  }

  @Get('kpi/organisation')
  @ApiOperation({
    summary: 'Get creative KPI for organization',
    description:
      'Retrieve comprehensive creative KPI metrics including creative counts by type and brand, top creatives by usage, and statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Creative KPI retrieved successfully',
    type: CreativeKpiDto,
  })
  async getCreativeKpi(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organisation_id') organisationId: string,
  ): Promise<CreativeKpiDto> {
    const manager =
      await this.tenantConnection.getEntityManagerForOrganization(
        organisationId,
      );
    return this.creativeKpiService.getCreativeKpi(manager);
  }
}
