/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard, RolesGuard } from '@app/modules/auth/guards';
import { Roles } from '@app/modules/auth/decorators';
import { UserManagementService } from '../services/user-management.service';
import {
  FilterUsersDto,
  UpdateUserStatusDto,
  UpdateUserRolesDto,
} from '../dto';

@ApiTags('User Management (SuperAdmin)')
@ApiBearerAuth()
@Controller('superadmin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class UserController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users across all tenants (SuperAdmin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tenant_id', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  async getAllUsers(@Query() filterDto: FilterUsersDto) {
    return this.userManagementService.getAllUsers(filterDto);
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Get all pending user invitations (SuperAdmin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of pending invitations retrieved successfully',
  })
  async getPendingInvitations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userManagementService.getPendingInvitations(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID (SuperAdmin only)' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userManagementService.getUserById(id);
  }

  @Patch('tenants/:tenantId/validate')
  @ApiOperation({
    summary: 'Validate/approve a pending tenant (SuperAdmin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant validated and approved successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async validateTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.userManagementService.validateTenant(tenantId);
  }

  @Patch('tenants/:tenantId/reject')
  @ApiOperation({ summary: 'Reject a pending tenant (SuperAdmin only)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant rejected successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async rejectTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() body: { reason?: string },
  ) {
    return this.userManagementService.rejectTenant(tenantId, body?.reason);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: "Update user's roles (SuperAdmin only)" })
  @ApiResponse({
    status: 200,
    description: 'User roles updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRolesDto: UpdateUserRolesDto,
  ) {
    return this.userManagementService.updateUserRoles(id, updateRolesDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (SuperAdmin only)' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: UpdateUserStatusDto,
  ) {
    return this.userManagementService.updateUserStatus(id, statusDto);
  }

  @Post('invitations/:id/accept')
  @ApiOperation({
    summary: 'Accept an invitation on behalf of user (SuperAdmin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async acceptInvitation(@Param('id', ParseUUIDPipe) invitationId: string) {
    return this.userManagementService.acceptInvitation(invitationId);
  }

  @Post('invitations/:id/reject')
  @ApiOperation({ summary: 'Reject an invitation (SuperAdmin only)' })
  @ApiResponse({
    status: 200,
    description: 'Invitation rejected successfully',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async rejectInvitation(@Param('id', ParseUUIDPipe) invitationId: string) {
    return this.userManagementService.rejectInvitation(invitationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user (SuperAdmin only)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userManagementService.deleteUser(id);
  }

  @Get('tenants/:tenantId/users')
  @ApiOperation({
    summary: 'Get all users for a specific tenant (SuperAdmin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tenant users retrieved successfully',
  })
  async getTenantUsers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userManagementService.getTenantUsers(tenantId, page, limit);
  }
}
