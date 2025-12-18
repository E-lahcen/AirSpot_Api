import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading provider of innovative solutions',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  @IsUrl({}, { message: 'logo must be a valid URL' })
  logo?: string;

  @ApiPropertyOptional({
    description: 'Tenant region',
    example: 'us-east-1',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Whether tenant is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Default role for new members',
    example: 'member',
  })
  @IsString()
  @IsOptional()
  default_role?: string;

  @ApiPropertyOptional({
    description: 'Whether to enforce domain restrictions',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  enforce_domain?: boolean;

  @ApiPropertyOptional({
    description: 'Allowed domain for user emails',
    example: 'acme.com',
  })
  @IsString()
  @IsOptional()
  domain?: string;
}
