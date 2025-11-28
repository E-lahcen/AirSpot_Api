import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtained from login or token exchange',
    example: 'AEu4IL3F5xKjN...',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @ApiProperty({
    description: 'Tenant slug for multi-tenant authentication',
    example: 'acme-corporation',
  })
  @IsString()
  @IsNotEmpty()
  tenant_slug: string;
}
