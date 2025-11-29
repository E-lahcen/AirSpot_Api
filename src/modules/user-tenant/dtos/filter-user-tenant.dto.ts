import { IsDefined, IsEmail, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@app/common/dtos';

export class FilterUserTenantDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by email',
    example: 'user@example.com',
  })
  @IsDefined()
  @IsEmail()
  email: string;
}
