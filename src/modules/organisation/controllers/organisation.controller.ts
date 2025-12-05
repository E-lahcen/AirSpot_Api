import { Roles } from '@app/modules/auth/decorators/roles.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { AuthenticatedUser, CurrentUser } from '@app/modules/auth/decorators';
import { OrganisationService } from '../services/organisation.service';
import { AuthGuard } from '@app/modules/auth/guards';

@Controller('organisations')
@UseGuards(AuthGuard)
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @Roles('owner', 'admin')
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
  @Roles('owner', 'admin')
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
  @Roles('owner', 'admin')
  async getOrganizationsByOwner(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    console.log(`Fetching organizations for owner: ${userId}`);
    return this.organisationService.findOrganizationsByOwner(userId);
  }
}
