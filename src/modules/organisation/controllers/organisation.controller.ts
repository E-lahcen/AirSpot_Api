import { Roles } from '@app/modules/auth/decorators/roles.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationStatusDto } from '../dto/update-organization-status.dto';
import { AuthenticatedUser, CurrentUser } from '@app/modules/auth/decorators';
import { OrganisationService } from '../services/organisation.service';
import { OrganisationKpiService } from '../services/organisation-kpi.service';
import { AuthGuard } from '@app/modules/auth/guards';
import {
  OrganisationKpiDto,
  OrganisationKpiSummaryDto,
  MultipleOrganisationsKpiDto,
} from '../dto/organisation-kpi.dto';

@Controller('organisations')
@UseGuards(AuthGuard)
export class OrganisationController {
  constructor(
    private readonly organisationService: OrganisationService,
    private readonly kpiService: OrganisationKpiService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @Roles('owner', 'admin', 'super_admin')
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationService.createOrganization(dto, user);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({
    status: 200,
    description: 'List of organizations retrieved successfully',
  })
  @Roles('super_admin', 'owner', 'admin')
  async getAllOrganizations() {
    console.log('Fetching all organizations');
    return this.organisationService.findAllOrganizations();
  }

  @Get('by-owner/:userId')
  @ApiOperation({ summary: 'Get organizations by owner' })
  @ApiResponse({
    status: 200,
    description: 'List of organizations for the owner retrieved successfully',
  })
  @Roles('owner', 'admin', 'super_admin')
  async getOrganizationsByOwner(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    console.log(`Fetching organizations for owner: ${userId}`);
    return this.organisationService.findOrganizationsByOwner(userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update organization status' })
  @ApiResponse({
    status: 200,
    description: 'Organization status updated successfully',
  })
  @Roles('super_admin')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationStatusDto,
  ) {
    return this.organisationService.updateStatus(id, dto.status);
  }

  @Get(':id/kpi')
  @ApiOperation({
    summary: 'Get comprehensive KPI for a specific organization',
    description:
      'Retrieve detailed KPI metrics for campaigns, creatives, audiences, and ad variations for a specific organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization KPI retrieved successfully',
    type: OrganisationKpiDto,
  })
  @Roles('owner', 'admin', 'super_admin', 'member')
  async getOrganisationKpi(
    @Param('id', ParseUUIDPipe) organisationId: string,
  ): Promise<OrganisationKpiDto> {
    return this.kpiService.getOrganisationKpi(organisationId);
  }

  @Get(':id/kpi/summary')
  @ApiOperation({
    summary: 'Get KPI summary for a specific organization',
    description:
      'Retrieve a summary of key KPI metrics (campaign, creative, audience counts and budgets)',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization KPI summary retrieved successfully',
    type: OrganisationKpiSummaryDto,
  })
  @Roles('owner', 'admin', 'super_admin', 'member')
  async getOrganisationKpiSummary(
    @Param('id', ParseUUIDPipe) organisationId: string,
  ): Promise<OrganisationKpiSummaryDto> {
    return this.kpiService.getOrganisationKpiSummary(organisationId);
  }

  @Get('kpi/my-organisations/all')
  @ApiOperation({
    summary: 'Get KPI for all user organizations',
    description:
      'Retrieve KPI summaries for all organizations that the user belongs to (owned or member)',
  })
  @ApiResponse({
    status: 200,
    description: 'Multiple organizations KPI retrieved successfully',
    type: MultipleOrganisationsKpiDto,
  })
  @Roles('owner', 'admin', 'super_admin', 'member')
  async getMyOrganisationsKpi(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MultipleOrganisationsKpiDto> {
    // Get all organizations for the user
    const organisations =
      await this.organisationService.findOrganizationsByOwner(user.id);

    const tenantIds = organisations.map((org) => org.id);

    return this.kpiService.getMultipleOrganisationsKpi(tenantIds);
  }

  @Get('kpi/organisations/summary')
  @ApiOperation({
    summary: 'Get KPI summaries for specific organizations',
    description:
      'Retrieve KPI summaries for multiple organizations. Pass comma-separated organization IDs as query param.',
  })
  @ApiResponse({
    status: 200,
    description: 'Multiple organizations KPI retrieved successfully',
    type: MultipleOrganisationsKpiDto,
  })
  @Roles('owner', 'admin', 'super_admin', 'member')
  async getOrganisationsKpiSummary(
    @Query('ids') organisationIds: string,
  ): Promise<MultipleOrganisationsKpiDto> {
    if (!organisationIds) {
      throw new Error('At least one organization ID is required');
    }

    const tenantIds = organisationIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (tenantIds.length === 0) {
      throw new Error('At least one organization ID is required');
    }

    return this.kpiService.getMultipleOrganisationsKpi(tenantIds);
  }
}
