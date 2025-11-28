import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { InvitationType } from '../entities/invitation.entity';

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(InvitationType)
  @IsOptional()
  type?: InvitationType; // Defaults to TENANT_REGISTRATION

  @IsString()
  @IsOptional()
  role?: string; // Defaults to 'member' if not provided

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>; // Additional data specific to invitation type
}
