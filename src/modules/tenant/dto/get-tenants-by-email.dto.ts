import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class GetTenantsByEmailDto {
  @ApiProperty({
    description: 'User email address to find associated tenants',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
