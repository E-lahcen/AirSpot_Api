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
import { AdVariationService } from '../services';
import { AdVariationKpiService } from '../services/ad-variation-kpi.service';
import { CreateAdVariationDto, UpdateAdVariationDto } from '../dto';
import { FilterAdVariationDto } from '../dto/filter-ad-variation.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { AdVariationKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';
import {
  ApiCreateAdVariation,
  ApiGetAdVariations,
  ApiGetAdVariation,
  ApiUpdateAdVariation,
  ApiDeleteAdVariation,
} from '../docs';

@ApiTags('ad-variations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ad-variations')
export class AdVariationController {
  constructor(
    private readonly adVariationService: AdVariationService,
    private readonly adVariationKpiService: AdVariationKpiService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  @Post()
  @ApiCreateAdVariation()
  create(
    @Body() createAdVariationDto: CreateAdVariationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adVariationService.create(
      createAdVariationDto,
      user.id,
      user.tenantId,
    );
  }

  @Get()
  @ApiGetAdVariations()
  findAll(@Query() filterDto: FilterAdVariationDto) {
    return this.adVariationService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetAdVariation()
  findOne(@Param('id') id: string) {
    return this.adVariationService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateAdVariation()
  update(
    @Param('id') id: string,
    @Body() updateAdVariationDto: UpdateAdVariationDto,
  ) {
    return this.adVariationService.update(id, updateAdVariationDto);
  }

  @Delete(':id')
  @ApiDeleteAdVariation()
  remove(@Param('id') id: string) {
    return this.adVariationService.remove(id);
  }

  @Get('kpi/organisation')
  @ApiOperation({
    summary: 'Get ad variation KPI for organization',
    description:
      'Retrieve comprehensive ad variation KPI metrics including variation counts, active status, bidding strategies, and CPM data',
  })
  @ApiResponse({
    status: 200,
    description: 'Ad variation KPI retrieved successfully',
    type: AdVariationKpiDto,
  })
  async getAdVariationKpi(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organisation_id') organisationId: string,
  ): Promise<AdVariationKpiDto> {
    const manager =
      await this.tenantConnection.getEntityManagerForOrganization(
        organisationId,
      );
    return this.adVariationKpiService.getAdVariationKpi(manager);
  }
}
