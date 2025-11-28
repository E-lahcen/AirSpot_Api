import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeTokenDto {
  @ApiProperty({
    description: 'Custom Firebase token to exchange for ID token',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    name: 'custom_token',
  })
  @IsString()
  @IsNotEmpty()
  custom_token: string;

  @ApiProperty({
    description: 'Tenant slug for the authentication context',
    example: 'acme-corporation',
    name: 'tenant_slug',
  })
  @IsString()
  @IsNotEmpty()
  tenant_slug: string;
}
