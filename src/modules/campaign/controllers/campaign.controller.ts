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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CampaignService, CampaignMetricsService } from '../services';
import { CampaignKpiService } from '../services/campaign-kpi.service';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { FilterCampaignDto } from '../dto/filter-campaign.dto';
import { BulkUpsertCampaignMetricsDto } from '../dto/bulk-upsert-metrics.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import {
  ApiCreateCampaign,
  ApiGetCampaigns,
  ApiGetCampaign,
  ApiUpdateCampaign,
  ApiDeleteCampaign,
} from '../docs';
import { CampaignKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly campaignMetricsService: CampaignMetricsService,
    private readonly campaignKpiService: CampaignKpiService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  @Post()
  @ApiCreateCampaign()
  create(
    @Body() createCampaignDto: CreateCampaignDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignService.create(
      createCampaignDto,
      user.id,
      user.tenantId,
    );
  }

  @Get()
  @ApiGetCampaigns()
  findAll(@Query() filterDto: FilterCampaignDto) {
    return this.campaignService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetCampaign()
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateCampaign()
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiDeleteCampaign()
  remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Bulk upsert campaign metrics',
    description:
      'Insert or update campaign performance records, time distribution, reach metrics, and summary data',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign metrics have been successfully upserted.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request payload.',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found.',
  })
  bulkUpsertMetrics(
    @Body() bulkUpsertDto: BulkUpsertCampaignMetricsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Ensure the tenantId matches the authenticated user's tenant
    bulkUpsertDto.tenantId = user.tenantId;
    return this.campaignMetricsService.bulkUpsertMetrics(bulkUpsertDto);
  }

  @Get(':campaignId/metrics')
  @ApiOperation({
    summary: 'Get campaign metrics',
    description: 'Retrieve all metrics data for a specific campaign',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign metrics retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found.',
  })
  getCampaignMetrics(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignMetricsService.getCampaignMetrics(
      campaignId,
      user.tenantId,
    );
  }

  @Get('kpi/organisation')
  @ApiOperation({
    summary: 'Get campaign KPI for organization',
    description:
      'Retrieve comprehensive campaign KPI metrics for the current organization including status distribution, budget info, and goal breakdown',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign KPI retrieved successfully',
    type: CampaignKpiDto,
  })
  async getCampaignKpi(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organisation_id') organisationId: string,
  ): Promise<CampaignKpiDto> {
    const manager =
      await this.tenantConnection.getEntityManagerForOrganization(
        organisationId,
      );
    return this.campaignKpiService.getCampaignKpi(manager);
  }
}
