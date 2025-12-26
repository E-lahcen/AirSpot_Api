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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AudienceService } from '../services';
import { AudienceKpiService } from '../services/audience-kpi.service';
import { CreateAudienceDto, UpdateAudienceDto } from '../dto';
import { FilterAudienceDto } from '../dto/filter-audience.dto';
import { AuthGuard } from '../../auth/guards';
import { AuthenticatedUser, CurrentUser } from '../../auth/decorators';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { AudienceKpiDto } from '@app/modules/organisation/dto/organisation-kpi.dto';
import {
  ApiCreateAudience,
  ApiGetAudiences,
  ApiGetAudience,
  ApiUpdateAudience,
  ApiDeleteAudience,
} from '../docs';

@ApiTags('audiences')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('audiences')
export class AudienceController {
  constructor(
    private readonly audienceService: AudienceService,
    private readonly audienceKpiService: AudienceKpiService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  @Post()
  @ApiCreateAudience()
  create(
    @Body() createAudienceDto: CreateAudienceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.audienceService.create(
      createAudienceDto,
      user.id,
      user.tenantId,
    );
  }

  @Get()
  @ApiGetAudiences()
  findAll(@Query() filterDto: FilterAudienceDto) {
    return this.audienceService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetAudience()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.audienceService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateAudience()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ) {
    return this.audienceService.update(id, updateAudienceDto);
  }

  @Delete(':id')
  @ApiDeleteAudience()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.audienceService.remove(id);
  }

  @Get('kpi/organisation')
  @ApiOperation({
    summary: 'Get audience KPI for organization',
    description:
      'Retrieve comprehensive audience KPI metrics including audience counts by type, top audiences by usage, and reach statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Audience KPI retrieved successfully',
    type: AudienceKpiDto,
  })
  async getAudienceKpi(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organisation_id') organisationId: string,
  ): Promise<AudienceKpiDto> {
    const manager =
      await this.tenantConnection.getEntityManagerForOrganization(
        organisationId,
      );
    return this.audienceKpiService.getAudienceKpi(manager);
  }
}
