import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Name of the organization to create',
    example: 'Acme Corporation',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description:
      'Preferred slug for the organization (lowercase letters, numbers, hyphen)',
    example: 'acme-corp',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/i, {
    message: 'slug can only contain letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Short description of the organization',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Logo URL or data URI for the organization',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Region where the organization operates',
    example: 'us-east',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    description: 'Default role assigned to new members',
    example: 'member',
  })
  @IsOptional()
  @IsString()
  defaultRole?: string;

  @ApiPropertyOptional({
    description: 'Whether to enforce user email domain restrictions',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enforceDomain?: boolean;

  @ApiPropertyOptional({
    description: 'Allowed email domain (required if enforceDomain is true)',
    example: 'example.com',
  })
  @ValidateIf((o: CreateOrganizationDto) => o.enforceDomain === true)
  @IsString()
  domain?: string;
}
