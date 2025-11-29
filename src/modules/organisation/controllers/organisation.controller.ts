import { Roles } from '@app/modules/auth/decorators/roles.decorator';
import { Body, ConflictException, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { AuthenticatedUser, CurrentUser } from '@app/modules/auth/decorators';
import { OrganisationService } from '../services/organisation.service';

@Controller('organisation')
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
}
