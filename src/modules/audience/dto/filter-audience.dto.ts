import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@app/common/dtos';
import { TargetType } from '../entities/audience.entity';

export class FilterAudienceDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by ad variation ID' })
  @IsOptional()
  @IsUUID()
  variation_id?: string;

  @ApiPropertyOptional({
    enum: TargetType,
    description: 'Filter by target type',
  })
  @IsOptional()
  @IsEnum(TargetType)
  type?: TargetType;

  @ApiPropertyOptional({ description: 'Filter by target ID' })
  @IsOptional()
  @IsString()
  target_id?: string;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsOptional()
  @IsUUID()
  owner_id?: string;
}
