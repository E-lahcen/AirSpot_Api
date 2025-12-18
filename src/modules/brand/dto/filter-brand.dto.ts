import { PaginationDto } from '@app/common/dtos';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterBrandDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by organization (tenant) ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by brand name (partial match)',
    example: 'Nike',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
