import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N...',
  })
  @IsString()
  idToken: string;

  @ApiProperty({
    description:
      'Organisation subdomain for tenant context (used for login to existing organization)',
    example: 'acme-corp',
    required: false,
  })
  @IsString()
  @IsOptional()
  organisationSubdomain?: string;

  @ApiProperty({
    description:
      'Organisation name for new registration (used when creating new organization)',
    example: 'Acme Corporation',
    required: false,
  })
  @IsString()
  @IsOptional()
  organisationName?: string;
}
