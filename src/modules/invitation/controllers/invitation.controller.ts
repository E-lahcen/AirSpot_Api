import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { InvitationService } from "../services/invitation.service";
import {
  CurrentUser,
  AuthenticatedUser,
  AdminAccess,
} from "@app/modules/auth/decorators";
import { CreateInvitationDto } from "../dto/create-invitation";
import { AcceptInvitationDto } from "../dto/accept-invitation.dto";
import { AcceptInvitationResponseDto } from "../dto/accept-invitation-response.dto";
import { FilterInvitationDto } from "../dto/filter-invitation.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Invitations")
@Controller("invitations")
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  /**
   * Send an invitation (owner/admin only)
   */
  @Post()
  @AdminAccess()
  @ApiOperation({ summary: "Create and send an invitation" })
  @ApiResponse({ status: 201, description: "Invitation created successfully" })
  @ApiResponse({ status: 409, description: "Invitation already exists" })
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationService.createInvitation(user, createInvitationDto);
  }

  /**
   * Get all invitations with optional filters (owner/admin only)
   */
  @Get()
  @AdminAccess()
  @ApiOperation({
    summary: "Get all invitations with optional filters and pagination",
  })
  @ApiResponse({
    status: 200,
    description: "Invitations retrieved successfully",
  })
  async getInvitations(@Query() filters: FilterInvitationDto) {
    return this.invitationService.findAll(filters);
  }

  /**
   * Get invitation details by ID (owner/admin only)
   */
  @Get(":id")
  @AdminAccess()
  @ApiOperation({ summary: "Get invitation by ID" })
  @ApiResponse({
    status: 200,
    description: "Invitation retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  async getInvitation(@Param("id") id: string) {
    return this.invitationService.findById(id);
  }

  /**
   * Get invitation details by token (public endpoint)
   */
  @Get("verify/:token")
  @ApiOperation({ summary: "Verify an invitation token" })
  @ApiResponse({ status: 200, description: "Invitation details retrieved" })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  @ApiResponse({ status: 400, description: "Invitation expired or invalid" })
  async verifyInvitation(@Param("token") token: string) {
    return this.invitationService.getInvitationByToken(token);
  }

  /**
   * Accept an invitation (public endpoint for registration)
   */
  @Post("accept")
  @ApiOperation({ summary: "Accept an invitation" })
  @ApiResponse({
    status: 200,
    description: "Invitation accepted successfully",
    type: AcceptInvitationResponseDto,
  })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  @ApiResponse({ status: 400, description: "Invitation expired or invalid" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async acceptInvitation(
    @Body() acceptInvitationDto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    return this.invitationService.acceptInvitation(acceptInvitationDto);
  }

  /**
   * Delete an invitation (owner/admin only)
   */
  @Delete(":id")
  @AdminAccess()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an invitation" })
  @ApiResponse({ status: 204, description: "Invitation deleted successfully" })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  async deleteInvitation(@Param("id") id: string) {
    await this.invitationService.deleteInvitation(id);
  }

  /**
   * Revoke an invitation (owner/admin only)
   */
  @Post(":id/revoke")
  @AdminAccess()
  @ApiOperation({ summary: "Revoke an invitation" })
  @ApiResponse({ status: 200, description: "Invitation revoked successfully" })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  async revokeInvitation(@Param("id") id: string) {
    await this.invitationService.revokeInvitation(id);
    return { message: "Invitation revoked successfully" };
  }

  /**
   * Resend an invitation (owner/admin only)
   */
  @Post(":id/resend")
  @AdminAccess()
  @ApiOperation({ summary: "Resend an expired or pending invitation" })
  @ApiResponse({
    status: 200,
    description: "Invitation resent successfully with new token and expiration",
  })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  @ApiResponse({
    status: 400,
    description: "Invitation cannot be resent (invalid status)",
  })
  async resendInvitation(@Param("id") id: string) {
    return this.invitationService.resendInvitation(id);
  }
}
