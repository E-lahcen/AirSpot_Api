import { IsOptional, IsEnum, IsEmail, IsUUID } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationDto } from "@app/common/dtos";
import {
  InvitationStatus,
  InvitationType,
} from "../entities/invitation.entity";

export class FilterInvitationDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Filter by email",
    example: "user@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "Filter by invitation status",
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;

  @ApiPropertyOptional({
    description: "Filter by invitation type",
    enum: InvitationType,
    example: InvitationType.TENANT_REGISTRATION,
  })
  @IsOptional()
  @IsEnum(InvitationType)
  type?: InvitationType;

  @ApiPropertyOptional({
    description: "Filter by invitor user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  invitor_id?: string;

  @ApiPropertyOptional({
    description: "Filter by role ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  role_id?: string;
}
