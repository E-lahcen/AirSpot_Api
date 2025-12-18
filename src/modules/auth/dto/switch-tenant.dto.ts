import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SwitchTenantDto {
  @ApiProperty({
    description: 'Tenant subdomain/slug to switch to',
    example: 'acme-corp',
  })
  @IsString()
  tenantSlug: string;
}
