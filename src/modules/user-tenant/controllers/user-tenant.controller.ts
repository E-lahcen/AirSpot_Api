import { Controller, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard, RolesGuard } from '@app/modules/auth/guards';
import { Roles, Public } from '@app/modules/auth/decorators';
import { UserTenantService } from '../services/user-tenant.service';
import { FilterUserTenantDto } from '../dtos/filter-user-tenant.dto';
import { ApiGetUserTenants, ApiGetUserTenant } from '../docs/index';
import { ResponseMessage } from '@app/core/decorators/response-message.decorator';

@ApiTags('user-tenants')
@ApiBearerAuth()
@Controller('user-tenants')
@UseGuards(AuthGuard, RolesGuard)
export class UserTenantController {
  constructor(private readonly userTenantService: UserTenantService) {}

  @Get('by-email/:email')
  @Public()
  @ApiOperation({
    summary: 'Get tenants by email',
    description:
      'Retrieves a list of tenants associated with the provided email address. Returns only public information.',
  })
  @ApiParam({
    name: 'email',
    description: 'Email address to search for',
    example: 'user@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenants retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Tenants retrieved successfully',
        data: [
          {
            slug: 'acme-corporation',
            company_name: 'Acme Corporation',
            logo: 'https://example.com/logo.png',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No tenants found for the provided email',
  })
  @ResponseMessage({ message: 'Tenants retrieved successfully' })
  getTenantsByEmail(@Param('email') email: string) {
    return this.userTenantService.findTenantsByEmail(email);
  }

  @Get()
  @ApiGetUserTenants()
  @Roles('super_admin')
  findAll(@Query() filterDto: FilterUserTenantDto) {
    return this.userTenantService.findAll(filterDto);
  }

  @Get(':id')
  @ApiGetUserTenant()
  @Roles('super_admin')
  findOne(@Param('id') id: string) {
    return this.userTenantService.findOne(id);
  }
}
