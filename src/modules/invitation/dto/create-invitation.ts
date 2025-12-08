import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { InvitationType } from '../entities/invitation.entity';

export class CreateInvitationDto {
  @IsEmail()
  @IsOptional()
  email?: string; // Kept for backward compatibility

  @IsOptional()
  @IsEmail({}, { each: true })
  emails?: string[];

  @IsEnum(InvitationType)
  @IsOptional()
  type: InvitationType; // Defaults to TENANT_REGISTRATION

  @IsOptional()
  @IsString()
  @IsUUID()
  role_id?: string; // Defaults to 'member' if not provided

  @IsOptional()
  @IsNumber()
  expires_in?: number; // Number of days until expiration, defaults to 7

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>; // Additional data specific to invitation type
}
