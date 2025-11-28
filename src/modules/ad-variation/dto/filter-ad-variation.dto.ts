import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@app/common/dtos';
import { BiddingStrategy } from '../entities/ad-variation.entity';

export class FilterAdVariationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by variation name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by campaign ID' })
  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @ApiPropertyOptional({
    enum: BiddingStrategy,
    description: 'Filter by bidding strategy',
  })
  @IsOptional()
  @IsEnum(BiddingStrategy)
  bidding_strategy?: BiddingStrategy;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsOptional()
  @IsUUID()
  owner_id?: string;
}
